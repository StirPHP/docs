/** Programs the playground can load. Each one type-checks (see scripts/check-examples.mjs). */
export const examples: { name: string; code: string }[] = [
  {
    name: 'Sealed types and when',
    code: `namespace Shop

sealed interface Payment
data class Card(val last4: String) : Payment
data class Invoice(val days: Int) : Payment

function describe(p: Payment?): String = when (p) {
    is Card -> "card ending \${p->last4}"
    is Invoice -> "invoice, due in \${p->days} days"
    null -> "not paid yet"
}

// Try it: add \`data class Cash(val cents: Int) : Payment\`
// and watch the \`when\` above become an error.
echo describe(new Card("4242"))
`,
  },
  {
    name: 'Null safety',
    code: `function greet(name: String?): String {
    val shown = name?->trim() ?: "stranger"
    if (name != null && name->isBlank()) {
        return "Hello, whoever you are!"
    }
    return "Hello, \${shown}!"
}

echo greet("  Ada  ")
echo greet(null)

// Try it: call name->length() before the null check.
`,
  },
  {
    name: 'Values and variables',
    code: `val limit = 3            // never changes, no $
var $count = 0           // changes, always $

while ($count < limit) {
    $count += 1
}

// Try it: uncomment one of these.
// limit = 4
// var $limit = 4
echo "counted to \${$count}"
`,
  },
  {
    name: 'Records',
    code: `record Line {
    name: String
    cents: Int
    qty: Int = 1
}

function total(lines: List<Line>): Int = lines->sumOf { it->cents * it->qty }

val cart = listOf(
    Line { name = "coffee", cents = 350, qty = 2 },
    Line { name = "croissant", cents = 220 }
)
echo "total: \${total(cart)} cents"
`,
  },
  {
    name: 'Generics and lambdas',
    code: `interface HasArea {
    function area(): Float
}

data class Square(val side: Float) : HasArea {
    function area(): Float = side * side
}

function <T of HasArea> largest(items: List<T>): T? =
    items->maxByOrNull { it->area() }

val squares = listOf(1.0, 3.0, 2.0)->map { new Square(it) }
echo largest(squares)?->side ?: 0.0
`,
  },
  {
    name: 'Extension functions',
    code: `function String.shout(): String = this->uppercase() . "!"

function List<Int>.mean(): Float =
    if (this->isEmpty()) 0.0 else this->sum()->toFloat() / this->size()->toFloat()

echo "hello"->shout()
echo listOf(1, 2, 3, 4)->mean()

// Tick "inline extensions" to see the calls replaced by their bodies.
`,
  },
]
