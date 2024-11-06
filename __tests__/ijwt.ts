import { test } from "@jest/globals";
import { iJWT } from "../source/ijwt";

describe("iJWT initialisation", () => {
  test("Links are created correctly", () => {
    let ijwt = new iJWT();
    expect(ijwt.site_base).toBe("http://localhost/");

    ijwt = new iJWT({ site_path: "/D00264604/website/" });
    expect(ijwt.site_base).toBe("http://localhost/D00264604/website/");
  });

  test("File detection in file content", () => {
    const ijwt = new iJWT();
    document.body.innerHTML = `<div id="ijwt_header.html"></div><div id="ijwt_footer.html"></div>`;

    const files_found = ijwt.get_files_wanted({ file_doc: document });
    const file_names: (string | undefined)[] = [];
    files_found.forEach((e: Element) => {
      const matches = [...e.id.matchAll(/ijwt_(?<file_name>.*)/gm)].map(
        (match) => match.groups?.file_name,
      );
      file_names.push(...matches);
    });

    expect(file_names[0]).toBe("header.html");
    expect(file_names[1]).toBe("footer.html");
  });
});

describe("Cache Control ", () => {
  test("file set and get", () => {
    const ijwt = new iJWT({ mode: "production" });
    ijwt.cache_control({
      method: "set",
      name: "dummy_test",
      data: "Hello world",
    });

    const data = ijwt.cache_control({
      method: "get",
      name: "dummy_test",
    });

    expect(data).toBe("Hello world");
  });

  test("fetch file method", async () => {
    const ijwt = new iJWT({ mode: "production" });
    ijwt.cache_control({
      method: "set",
      name: "dummy_test",
      data: "Hello world",
    });

    const data = await ijwt.fetch_file_data("dummy_test");
    expect(data).toBe("Hello world");
  });

  test("delete method", async () => {
    const ijwt = new iJWT({ mode: "production" });
    ijwt.cache_control({
      method: "set",
      name: "dummy_test",
      data: "Hello world",
    });

    let data = await ijwt.fetch_file_data("dummy_test");
    expect(data).toBe("Hello world");

    ijwt.cache_control({
      method: "delete",
      name: "dummy_test",
    });

    data = await ijwt.fetch_file_data("dummy_test");
    expect(data).toBe(undefined);
  });
});

describe("Node Tree", () => {
  // set mode to production because files are not
  // stored in development mode and the server is
  // unavailable when testing
  test("creation", async () => {
    const ijwt = new iJWT({ mode: "production" });
    document.body.innerHTML = `<div id="ijwt_header.html"></div>`;

    ijwt.cache_control({
      method: "set",
      name: "header.html",
      data: `<div id="ijwt_bread.html"></div>`,
    });
    ijwt.cache_control({
      method: "set",
      name: "bread.html",
      data: `<div id="ijwt_footer.html"></div>`,
    });
    ijwt.cache_control({
      method: "set",
      name: "footer.html",
      data: "Feet!",
    });

    expect(
      (await ijwt.generate_node_tree({ file_doc: document })).children[0]
        .children[0].children[0].data.body.innerHTML,
    ).toBe("Feet!");
  });

  test("creation of all children", async () => {
    const ijwt = new iJWT({ mode: "production" });
    document.body.innerHTML = `<div id="ijwt_header.html"></div><div id="ijwt_header.html"></div><div id="ijwt_header.html"></div>`;

    ijwt.cache_control({
      method: "set",
      name: "header.html",
      data: `<div id="ijwt_footer.html"></div><div id="ijwt_footer.html"></div>`,
    });

    ijwt.cache_control({
      method: "set",
      name: "footer.html",
      data: "Feet!",
    });

    expect((await ijwt.generate_node_tree()).children.length).toEqual(3);
    expect(
      (await ijwt.generate_node_tree()).children[0].children.length,
    ).toEqual(2);
  });

  test("collapse of node tree", async () => {
    const ijwt = new iJWT({ mode: "production" });
    document.body.innerHTML = `<div id="ijwt_header.html"></div>`;

    ijwt.cache_control({
      method: "set",
      name: "header.html",
      data: `<div id="ijwt_bread.html"></div>`,
    });
    ijwt.cache_control({
      method: "set",
      name: "bread.html",
      data: `<div id="ijwt_footer.html"></div>`,
    });
    ijwt.cache_control({
      method: "set",
      name: "footer.html",
      data: "Feet!",
    });

    const node_tree = await ijwt.generate_node_tree({ file_doc: document });
    expect(ijwt.collapse_node_tree(node_tree).body.innerHTML).toEqual("Feet!");
  });

  test("collapse of node tree and preserve anonymous functions", async () => {
    const ijwt = new iJWT({ mode: "production" });
    document.body.innerHTML = `<div id="ijwt_script.html"></div>`;

    ijwt.cache_control({
      method: "set",
      name: "script.html",
      data: `<p>Hello world</p><script>(()=>{console.log('Hello world')})()</script>`,
    });

    const node_tree = await ijwt.generate_node_tree({ file_doc: document });
    expect(ijwt.collapse_node_tree(node_tree).body.innerHTML).toEqual(
      `<p>Hello world</p><script>(()=>{console.log('Hello world')})()</script>`,
    );
  });
});

describe("URL Moderator", () => {
  test("url qualifier", () => {
    let ijwt = new iJWT();
    let test_path = "http://localhost/static/css/global.css";
    let a = ijwt.url_qualifier("../static/css/global.css");
    let b = ijwt.url_qualifier("../../static/css/global.css");
    let c = ijwt.url_qualifier("/../../static/css/global.css");
    let d = ijwt.url_qualifier("./../static/css/global.css");
    let e = ijwt.url_qualifier("./static/css/global.css");
    let f = ijwt.url_qualifier("static/css/global.css");

    expect(a).toEqual(test_path);
    expect(b).toEqual(test_path);
    expect(c).toEqual(test_path);
    expect(d).toEqual(test_path);
    expect(e).toEqual(test_path);
    expect(f).toEqual(test_path);

    ijwt = new iJWT({ site_path: "/D00264604/website/" });
    a = ijwt.url_qualifier("../static/css/global.css");
    b = ijwt.url_qualifier("../../static/css/global.css");
    c = ijwt.url_qualifier("/../../static/css/global.css");
    d = ijwt.url_qualifier("./../static/css/global.css");
    e = ijwt.url_qualifier("./static/css/global.css");
    f = ijwt.url_qualifier("static/css/global.css");

    test_path = "http://localhost/D00264604/website/static/css/global.css";

    expect(a).toEqual(test_path);
    expect(b).toEqual(test_path);
    expect(c).toEqual(test_path);
    expect(d).toEqual(test_path);
    expect(e).toEqual(test_path);
    expect(f).toEqual(test_path);
  });

  //test("url resolver", async () => {
  //  let ijwt = new iJWT({ mode: "production" });
  //
  //  ijwt.cache_control({
  //    method: "set",
  //    name: "global.css",
  //    data: `body{ }`,
  //  });
  //  const url = await ijwt.url_resolver("global.css");
  //});
});

describe("utility functions", () => {
  test("hasher method", () => {
    const ijwt = new iJWT({ mode: "production" });

    expect(ijwt.hasher("Hello world")).toEqual(-832992604);
    expect(ijwt.hasher("Hello world")).toEqual(-832992604);

    expect(ijwt.hasher("Hello_world")).toEqual(970643909);
  });
  test("cache class method", () => {
    const ijwt = new iJWT({ mode: "production" });
    const original = `
    <div id="this_is_a_cache" class="ijwt_cache">This will be in cache!</div>
    <script id="tagy" class="ijwt_cache">
    const x = () => {
      console.log()
    }
    </script>
    `;
    document.body.innerHTML = original;
    ijwt.cache_manager(document);

    document.body.innerHTML = `
    <div id="this_is_a_cache" class="ijwt_cache"></div>
    <script id="tagy" class="ijwt_cache">
    </script>
    `;
    ijwt.cache_manager(document);
    expect(document.body.innerHTML).toEqual(original);
  });
  test("remove tags", () => {
    const ijwt = new iJWT({ mode: "production" });
    document.body.innerHTML = `<div id="deleteme" class="ijwt_remove"></div>`;
    let ele = document.getElementById("deleteme");
    expect(ele).toBeDefined();
    ijwt.remove_tags(document);

    ele = document.getElementById("deleteme");
    expect(ele).toBeNull();
  });
});
