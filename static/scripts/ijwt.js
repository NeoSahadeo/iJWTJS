"use strict";
// iJWT JS - by Neo Sahadeo
// I Just Want Templating JS is a Javascript
// implementation of an old templating engine
// I developed back in highschool in Python.
// The repo is dead and privated but the memory
// lives on in my brain.
//
// MIT LICENCE

// The site_directive is the directory
// of the site. The site_directive should
// be known ahead of production launch.
//
// Example:
//
// 		https://mysql05.comp.dkit.ie/D00264604/Week3
//
// 		site_directive = D00264604/Week3

const site_directive = "";

const directive_list = ["", "pages", "partials"];
const base_page = "index.html";

// DO NOT TOUCH UNLESS YOU KNOW WHAT YOU ARE DOING
const file_search_exp = new RegExp(
  /\<!--ijwt_(?<file_name>[a-zA-Z0-9_.-]+)--\>/gm,
);

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

// -----------------------------------------------

export function url_resolver() {
  /**
   * Provides a consitent way to generate to
   * correct url for resources.
   *
   * @return {String} url - Base URL Path + site_directive
   */
  const base_path = new RegExp(/https?:\/\/.*?(?=\/)/gm);
  return window.location.href.match(base_path)[0] + site_directive;
}

export async function get_file_data(file_path) {
  /**
   * Get the file data from a given file path.
   *
   * @param {String} file_path - The file path wanted
   * @return {String|undefined} file_data - The data from the file
   */

  try {
    const response = await fetch(file_path);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

export async function fetch_file_data(file_name) {
  return await get_file_data(await search_directives(file_name));
}

export async function search_directives(file_name) {
  /**
   * Searches all listed directories for the file
   * wanted to generate the file path url.
   *
   * @param {String} file_name - The file name wanted
   * @return {String|undefined} location - The file path url
   */
  const base_url = url_resolver();

  for (let x = 0; x < directive_list.length; ++x) {
    const query = `${base_url}/${directive_list[x]}/${file_name}`;
    try {
      const response = await fetch(query, {
        mode: "no-cors",
      });
      if (response.ok) {
        return query;
      }
    } catch (error) {
      console.error(error);
    }
  }
  return undefined;
}

export async function search_file(file_content = "__ijwt_current_file__") {
  /**
   * Searches the file for ijwt_[name] tags.
   *
   * @param {String} file_content - The file content
   * @return {[{file_name: String, insert_location}]|[]} location - Tags founds
   */
  if (file_content === "__ijwt_current_file__") {
    file_content = fetch_file_data(base_page);
  }

  return [...file_content.matchAll(file_search_exp)].map((match) => {
    return {
      file_name: match.groups.file_name,
      insert_location: match.index,
      // 12 comes from the default tag length
      // <!--ijwt_-->
    };
  });
}

export async function build_tree(file_content = "__ijwt_current_file__") {
  /**
   * Builds a file tree structure for the current
   * file if no file is provided.
   *
   * @param {String} file_content - This is the content of a file
   * @return {Node} node - This the node tree structure
   */
  if (file_content == "__ijwt_current_file__") {
    //file_content = await fetch_file_data(base_page);
    file_content = document.documentElement.outerHTML;
  }

  const node = new Node(file_content);

  let files_found = await search_file(file_content);

  for (const x in files_found) {
    node.add({
      file_content: await fetch_file_data(files_found[x].file_name),
      insert_location: files_found[x].insert_location,
    });
  }
  for (let x = 0; x < node.children.length; ++x) {
    node.children[x] = await build_tree(node.children[x].data.file_content);
  }
  return node;
}

export async function collapse_tree(node_tree) {
  /**
   * Collapses a tree node structure to a single file.
   */
  let operations_order = await search_file(node_tree.data);
  const operations_length = operations_order.length;
  for (const operation_index in operations_order) {
    const new_data = await collapse_tree(node_tree.children[operation_index]);

    // This is used to fix dynamic array changing
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
          +12,
      );
    operations_order = await search_file(node_tree.data);
  }
  return node_tree.data;
}

export async function populate_dom() {
  /**
   * Generates the DOM and populates the files.
   */
  const node_tree = await build_tree();
  const html_parser = new DOMParser();
  const serializer = new XMLSerializer();
  let compiled_page = await collapse_tree(node_tree);

  if (
    window.location.pathname !== `/${base_page}` &&
    window.location.pathname !== "/"
  ) {
    const base_page_data = await collapse_tree(
      await build_tree(await fetch_file_data(base_page)),
    );
    const base_page_dom = html_parser.parseFromString(
      base_page_data,
      "text/html",
    );
    base_page_dom.getElementsByTagName("main")[0].innerHTML = compiled_page;
    base_page_dom.getElementById("ijwt").remove();
    compiled_page = serializer.serializeToString(base_page_dom);
  }
  document.documentElement.innerHTML = compiled_page;
}

// <<<<<
// You can remove this if you
// prefer to run the functions
// as a module.
window.onload = () => {
  populate_dom();
};
// >>>>>
