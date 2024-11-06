"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ijwt_1 = require("./ijwt");
(async () => {
    const ijwt = new ijwt_1.iJWT({ mode: "developement" });
    const node_tree = await ijwt.generate_node_tree({ file_doc: document });
    ijwt.collapse_node_tree(node_tree);
})();
