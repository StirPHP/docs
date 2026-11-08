// `$query->whereEmail($email)`, on a query of any model
fn magic_method(type, name, is_static) {
    if type.class_name == "App\\Query" && name.starts_with("where") { return "$this"; }
}

// what a proxy has is what the value it's a proxy for has
fn magic_property(type, name) {
    if type.class_name == "App\\Proxy" { return #{ forward_to: type.type_args[0].to_string() }; }
}
