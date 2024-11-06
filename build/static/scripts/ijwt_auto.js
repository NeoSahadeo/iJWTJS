import { iJWT } from "./ijwt.js";
(async () => {
    const ijwt = new iJWT({ mode: "developement" });
    const node_tree = await ijwt.generate_node_tree({ file_doc: document });
    ijwt.collapse_node_tree(node_tree);
    ijwt.cache_manager(document);
    ijwt.remove_tags(document);
})();
