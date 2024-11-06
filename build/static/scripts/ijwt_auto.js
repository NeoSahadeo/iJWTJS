import { iJWT } from "./ijwt";
(async () => {
    const ijwt = new iJWT({ mode: "developement" });
    const node_tree = await ijwt.generate_node_tree({ file_doc: document });
    ijwt.collapse_node_tree(node_tree);
})();
