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

class Node {
  constructor(data) {
    this.data = data;
    this.children = [];
  }

  add(data) {
    const node = new Node(data);
    this.children.push(node);
  }
}

export class iJWT {
  constructor({
    site_base = "",
    directories = ["", "pages", "partials"],
    base_page = "index.html",
    mode = "production",
  }) {
    if (mode === "development") {
      this.cache_control({ method: "clear" });
    } else {
    }
    this.base_url =
      window.location.href.match(/https?:\/\/.*?(?=\/)/gm)[0] + site_base;
    this.relative_url = window.location.href.match(
      /https?:\/\/.*?(?=\/)(.*)/gm,
    )[0];
    this.directories = directories;
    this.base_page = base_page;
    this.mode = mode;

    this.file_search_exp = new RegExp(
      /\<!--ijwt_(?<file_name>[a-zA-Z0-9_.-]+)--\>/gm,
    );
    this.file_tag_length = 12; // <!--ijwt_-->

    this.html_parser = new DOMParser();
    this.html_serializer = new XMLSerializer();
  }

  cache_control({ name, data = "", method }) {
    /**
     * Allows set, get and remove of cache
     * in localStorage.
     *
     * @param {String} name - The name of the cache
     * @param {String} data - The data of the cache
     * @param {"set", "delete", "clear", "get"} method - The method wanted to perform
     * @return {String|undefined} storage item
     */

    if (method === "set") window.localStorage.setItem(`ijwt_${name}`, data);
    if (method === "delete") window.localStorage.removeItem(`ijwt_${name}`);
    if (method === "clear") window.localStorage.clear();
    if (method === "get") {
      const data = window.localStorage.getItem(`ijwt_${name}`);
      return data ? data : undefined;
    }
    return undefined;
  }

  async fetch_file_data(file_name) {
    /**
     * Fetch file data given a file name.
     *
     * @param {String} file_name - The file name
     * @return {Promise<String | undefined>} file_content - The file content
     */
    for (const x in this.directories) {
      const cached_data = this.cache_control({
        name: file_name,
        method: "get",
      });
      if (cached_data && this.mode == "production") {
        return cached_data;
      }

      const query = new URL(
        `${this.directories[x]}/${file_name}`,
        this.base_url,
      );
      try {
        const response = await fetch(query);
        if (response.ok) {
          const page_data = await response.text();
          this.cache_control({
            name: file_name,
            data: page_data,
            method: "set",
          });
          return page_data;
        }
      } catch (error) {
        console.info("File not found");
      }
    }
    return undefined;
  }

  search_file(file_content = "__ijwt_current_file__") {
    /**
     * Searches the file for ijwt_[name] tags.
     *
     * @param {String} file_content - The file content
     * @return {[{file_name: String, insert_location}]|[]} location - Tags founds
     */
    if (file_content === "__ijwt_current_file__") {
      file_content = fetch_file_data(this.base_page);
    }

    return [...file_content.matchAll(this.file_search_exp)].map((match) => {
      return {
        file_name: match.groups.file_name,
        insert_location: match.index,
      };
    });
  }

  async build_tree(file_content = "__ijwt_current_file__") {
    /**
     * Builds a file tree structure for the current
     * file. Defaults to current file if no file is provided.
     *
     * @param {String} file_content - This is the content of a file
     * @return {Node} node - This the node tree structure
     */
    if (file_content == "__ijwt_current_file__") {
      file_content = document.documentElement.outerHTML;
    }

    const node = new Node(file_content);

    let files_found = this.search_file(file_content);

    for (const x in files_found) {
      node.add({
        file_content: await this.fetch_file_data(files_found[x].file_name),
        insert_location: files_found[x].insert_location,
      });
    }
    for (const x in node.children) {
      node.children[x] = await this.build_tree(
        node.children[x].data.file_content,
      );
    }
    return node;
  }

  collapse_tree(node_tree) {
    /**
     * Collapses a tree node structure to a single file.
     *
     * @param {Node} node_tree - The node tree structure
     */

    let operations_order = this.search_file(node_tree.data);

    const operations_length = operations_order.length;
    for (const operation_index in operations_order) {
      const new_data = this.collapse_tree(node_tree.children[operation_index]);

      // This is used to fix dynamic array sizing
      while (operations_length !== operations_order.length) {
        operations_order.unshift({});
      }
      node_tree.data =
        node_tree.data.slice(
          0,
          operations_order[operation_index].insert_location,
        ) +
        new_data +
        node_tree.data.slice(
          operations_order[operation_index].insert_location +
            operations_order[operation_index].file_name.length +
            +this.file_tag_length,
        );
      operations_order = this.search_file(node_tree.data);
    }
    return node_tree.data;
  }

  async update_dom() {
    /**
     * Generates the DOM and populates the DOM. Also does some clean up.
     */

    // Build and collapse tree then compile the page
    let compiled_page = await this.generate_page();
    let full_page = "";
    compiled_page = this.html_parser.parseFromString(
      compiled_page,
      "text/html",
    );

    // Remove script tags that are marked for removal
    // after generating the page insert
    this.remove_tags(compiled_page);
    compiled_page = this.html_serializer.serializeToString(compiled_page);

    if (
      window.location.pathname !== "/" &&
      window.location.pathname !== "/index.html"
    ) {
      // Fetch the base page and insert exisiting content
      // and build the page
      let base_page_data = await this.fetch_file_data(this.base_page);
      base_page_data = this.html_parser.parseFromString(
        base_page_data,
        "text/html",
      );
      base_page_data.getElementById("ijwt_insert").innerHTML = compiled_page;
      full_page = this.html_serializer.serializeToString(base_page_data);
      full_page = await this.generate_page(full_page);
    } else {
      full_page = compiled_page;
    }

    // Resolve urls
    full_page = this.html_parser.parseFromString(full_page, "text/html");
    full_page.querySelectorAll(".ijwt_url_resolve").forEach((e) => {
      if (e.href) {
        e.href = this.url_element_resolver(e);
      } else if (e.src) {
        e.src = this.url_element_resolver(e);
      }
    });
    this.remove_tags(full_page);
    full_page = this.html_serializer.serializeToString(full_page);

    // Write out the final document
    document.open();
    document.write(full_page);
    document.close();
  }

  async generate_page(file_content = "__ijwt_current_file__") {
    /**
     * A generation method that will build and collapse a node
     * tree.
     *
     * @param {String} file_content - This is the content of a file
     * @return {String} file_content - This the build and collaped node tree
     */
    const node_tree = await this.build_tree(file_content);
    return this.collapse_tree(node_tree);
  }

  remove_tags(html_document) {
    /**
     * Remove any blocks marked with a remove tag.
     *
     * @param {HTMLDocument} html_document - This is a reference to an html doc element
     */
    html_document.querySelectorAll(".ijwt_remove").forEach((e) => e.remove());
  }

  url_element_resolver(element) {
    /**
     * Generates an absolute url. And attaches
     * it to the element.
     *
     * @param {HTMLElement} element - This is a reference to an html doc element
     * @return {String} url - The absolute URL
     */
    let gen_url = "";
    const serial_element = this.html_serializer.serializeToString(element);
    [...serial_element.matchAll(/(href|src)="(?<path>.*)"/gm)].forEach((e) => {
      gen_url = e.groups.path.match(/\/\w+.*/gm)[0];
    });
    return this.base_url + gen_url;
  }
  url_string_resolver(url_string) {
    /**
     * Generates an absolute url.
     *
     * @param {HTMLElement} element - This is a reference to an html doc element
     * @return {String} url - The absolute URL
     */
    return this.base_url + url_string;
  }
}

//const ijwt = new iJWT({ mode: "development" });
//ijwt.update_dom();

//import { iJWT } from "./static/scripts/ijwt.js";
//import { UnitTest } from "./static/scripts/tests.js";
//const ijwt = new iJWT({ mode: "development" });
//const tests = new UnitTest(ijwt);
//tests.test_all();
