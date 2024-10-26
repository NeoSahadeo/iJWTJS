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
      insert_location: match.index + match.groups.file_name.length + 12,
      // 12 comes from the default tag length
      // <!--ijwt_-->
    };
  });
}

export async function build_tree(file_content = "__ijwt_parent_file__") {
  /**
   * Builds a file tree structure for the current
   * file if no file is provided.
   *
   * @param {String} file_content - This is the content of a file
   * @return {Node} node - This the node tree structure
   */

  const node = new Node(file_content);

  if (file_content === "__ijwt_parent_file__") {
    file_content = await fetch_file_data(base_page);
  }

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

export async function populate_dom() {
  const node_tree = await build_tree();

  console.log(node_tree);

  //let nodes = node_tree.children;
  //let temp = [];
  //let collapsed_tree = [];

  //while (nodes.length > 0) {
  //  const original_size = nodes.length;
  //
  //  const node = nodes.shift();
  //  //temp.push(node.data);
  //  nodes.unshift(...node.children);
  //
  //  //const updated_size = nodes.length;
  //  //const size_diff = Math.abs(original_size - updated_size);
  //  ////console.log(original_size, updated_size, size_diff);
  //  //if (size_diff === 1) {
  //  //  collapsed_tree.push(temp);
  //  //  temp = [];
  //  //}
  //}

  //console.log(collapsed_tree);
  //for (let x = 0; x < collapsed_tree.length; ++x) {
  //  const contents = [];
  //  const inserts = [0];
  //  for (const y in collapsed_tree[x]) {
  //    const tags_found = await search_file(collapsed_tree[x][y]);
  //    tags_found.forEach((e) => {
  //      inserts.push(e.insert_location);
  //    });
  //  }
  //  console.log(collapsed_tree);
  //  inserts.forEach((e, index) => {
  //    if (e !== 0) {
  //      //index = collapsed_tree[x][e + 1] === undefined ? e : e + 1;
  //      //console.log(collapsed_tree[x][index]);
  //      console.log(
  //        collapsed_tree[x][0].slice(0, e) +
  //          collapsed_tree[x][index] +
  //          collapsed_tree[x][0].slice(e, -1),
  //      );
  //    }
  //  });
  //  break;
  //}
}
