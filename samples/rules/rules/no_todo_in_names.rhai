// Methods whose name says they're unfinished, reported from level 3.
fn visit_method(node, ctx) {
    if node.name.to_lower().contains("todo") {
        ctx.warning("`" + node.name + "` looks unfinished", "app.unfinishedName", #{ level: 3 });
    }
}
