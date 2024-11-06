"use strict";
/*
MIT License 2024 Neo Sahadeo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the “Software”), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.iJWT = void 0;
class Node {
    data;
    children;
    constructor(data) {
        this.data = data;
        this.children = [];
    }
    add(node) {
        this.children.push(node);
    }
}
class iJWT {
    site_path;
    directories;
    index;
    mode;
    site_base;
    html_parser;
    html_serializer;
    constructor({ site_path = "/", directories = ["", "pages", "partials", "static/css", "static/scripts"], index = "index.html", mode = "developement", } = {}) {
        this.site_path = site_path;
        this.index = index;
        this.directories = directories;
        this.mode = mode;
        const site_base = window.location.href.match(/https?:\/\/.*?(?=\/)/gm);
        this.site_base = site_base ? site_base[0] + site_path : "";
        this.html_parser = new DOMParser();
        this.html_serializer = new XMLSerializer();
    }
    parse(html) {
        return this.html_parser.parseFromString(html, "text/html");
    }
    serialize(doc) {
        return this.html_serializer.serializeToString(doc);
    }
    cache_control({ name, method, data = "", }) {
        if (method === "set")
            window.localStorage.setItem(`ijwt_${name}`, data);
        if (method === "delete")
            window.localStorage.removeItem(`ijwt_${name}`);
        if (method === "clear")
            window.localStorage.clear();
        if (method === "get") {
            const data = window.localStorage.getItem(`ijwt_${name}`);
            return data ? data : undefined;
        }
        return undefined;
    }
    async fetch_file_data(file_name) {
        const cached_data = this.cache_control({
            name: file_name,
            method: "get",
        });
        if (cached_data && this.mode === "production") {
            return cached_data;
        }
        for (const index in this.directories) {
            const query = new URL(`${this.directories[index]}/${file_name}`, this.site_base);
            try {
                const response = await fetch(query);
                if (response.ok) {
                    const page_data = await response.text();
                    if (this.mode === "production") {
                        this.cache_control({
                            name: file_name,
                            data: page_data,
                            method: "set",
                        });
                    }
                    return page_data;
                }
                console.info("File not found");
            }
            catch (error) { }
        }
        return undefined;
    }
    async search_directories(file_name) {
        for (const index in this.directories) {
            const query = new URL(`${this.directories[index]}/${file_name}`, this.site_base);
            try {
                const response = await fetch(query, { method: "HEAD" });
                if (response.ok) {
                    return query.href;
                }
                console.info("File not found");
            }
            catch (error) { }
        }
        return undefined;
    }
    get_files_wanted({ file_doc, selector = "[id^=ijwt_]", }) {
        // Search file content to see if there are files that should be downloaded.
        const files_found = file_doc.querySelectorAll(selector);
        return files_found ? files_found : [];
    }
    extract_file_names(elements) {
        const file_names = [];
        elements.forEach((e) => {
            const matches = [...e.id.matchAll(/ijwt_(?<file_name>.*)/gm)].map((match) => match.groups?.file_name);
            file_names.push(...matches);
        });
        return file_names;
    }
    async generate_node_tree({ file_doc = document, } = {}) {
        const node = new Node(file_doc);
        const files_found = this.get_files_wanted({ file_doc });
        if (files_found.length === 0) {
            return node;
        }
        const file_names = this.extract_file_names(files_found);
        for (const index in file_names) {
            const file_data = await this.fetch_file_data(file_names[index]);
            if (file_data) {
                const file_document = this.parse(file_data);
                const _node_ = await this.generate_node_tree({
                    file_doc: file_document,
                });
                node.add(_node_);
            }
        }
        return node;
    }
    collapse_node_tree(node) {
        if (node.children.length === 0) {
            return node.data;
        }
        const elements = this.get_files_wanted({ file_doc: node.data });
        for (const index in node.children) {
            const child_node = node.children.shift();
            elements[index].outerHTML =
                this.collapse_node_tree(child_node).body.innerHTML;
        }
        return node.data;
    }
    url_qualifier(url) {
        const match = url.match(/(\w.*|\.)+$/);
        return this.site_base + match[0];
    }
    async url_resolver(file_name) {
        const url = await this.search_directories(file_name);
        return url;
    }
    hasher(value) {
        let hash = 0;
        let char = null;
        if (value.length === 0)
            return hash;
        for (let x = 0; x < value.length; x++) {
            char = value.charCodeAt(x);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return hash;
    }
    cache_manager(file_doc) {
        const caches_wanted = this.get_files_wanted({
            file_doc,
            selector: ".ijwt_cache",
        });
        caches_wanted.forEach((element) => {
            const hashed_code = this.hasher(element.id);
            const data = this.cache_control({
                name: hashed_code.toString(),
                method: "get",
            });
            if (this.mode === "production" && data) {
                element.innerHTML = data;
            }
            else {
                this.cache_control({
                    name: hashed_code.toString(),
                    method: "set",
                    data: element.innerHTML,
                });
            }
        });
    }
    remove_tags(file_doc) {
        file_doc.querySelectorAll(".ijwt_remove").forEach((e) => {
            e.remove();
        });
    }
}
exports.iJWT = iJWT;
