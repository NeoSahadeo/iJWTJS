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

const print_error = (a, b) => {
  const stack = new Error().stack;
  console.debug(`Test failed\n${stack}\n\nExpected:${a} \nRecieved:${b}`);
};
const print_pass = () => {
  console.debug("Test passed");
};

const assertEqual = (a, b) => {
  if (a === b) {
    print_pass();
  } else {
    print_error(a, b);
  }
};
const assertNotEqual = (a, b) => {
  if (a !== b) {
    print_pass();
  } else {
    print_error(a, b);
  }
};

const assertGreaterThan = (a, b) => {
  if (a > b) {
    print_pass();
  } else {
    print_error(a, b);
  }
};

const assertLessThan = (a, b) => {
  if (a < b) {
    print_pass();
  } else {
    print_error(a, b);
  }
};
export class UnitTest {
  constructor(ijwt_instance) {
    this.ijwt = ijwt_instance;
  }
  test_all() {
    this.ijwt.cache_control({ method: "clear" });
    const functions = Reflect.ownKeys(UnitTest.prototype).slice(2);
    for (const x in functions) {
      eval(`this.${functions[x]}()`);
    }
  }
  async test_fetch_file_data() {
    const response = await this.ijwt.fetch_file_data("index.html");
    const response_2 = await this.ijwt.fetch_file_data("indx.html");
    assertEqual(typeof response, "string");
    assertEqual(response_2, undefined);
  }

  async test_search_file() {
    const response = await this.ijwt.fetch_file_data("index.html");
    const tags = this.ijwt.search_file(response);
    assertGreaterThan(tags.length, 0);
  }

  test_cache_control() {
    // test cache set
    this.ijwt.cache_control({
      name: "index.html",
      data: "hello world",
      method: "set",
    });
    assertEqual(
      typeof this.ijwt.cache_control({
        name: "index.html",
        method: "get",
      }),
      "string",
    );

    // test cache delete
    this.ijwt.cache_control({
      name: "index.html",
      method: "delete",
    });
    assertEqual(
      this.ijwt.cache_control({
        name: "index.html",
        method: "get",
      }),
      undefined,
    );

    // test cache clear
    this.ijwt.cache_control({
      name: "index.html",
      data: "hello world",
      method: "set",
    });
    this.ijwt.cache_control({ method: "clear" });
    assertEqual(
      this.ijwt.cache_control({
        name: "index.html",
        method: "get",
      }),
      undefined,
    );
  }

  async test_build_tree() {
    const node_tree = await this.ijwt.build_tree();
    const nodes = node_tree.children;
    const structures_found = [];

    while (nodes.length > 0) {
      const node = nodes.shift();
      structures_found.push(node);
      nodes.unshift(...node.children);
    }
    assertGreaterThan(structures_found.length, 0);
  }

  async test_collapse_tree() {
    const node_tree = await this.ijwt.build_tree();
    assertEqual(typeof this.ijwt.collapse_tree(node_tree), "string");
  }

  async test_update_dom() {
    await this.ijwt.update_dom();
  }
}
