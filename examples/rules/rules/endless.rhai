// Never finishes: it's stopped after 1,000,000 operations.
fn visit_echo(node, ctx) {
    let n = 0;
    loop { n += 1; }
}
