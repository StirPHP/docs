# Formatter

`stirphp fmt` formats PHP in the style of [PER-CS](https://www.php-fig.org/per/coding-style/), and it only changes
whitespace: every token stays as it is, comments and trailing commas included, and strings, heredocs and inline HTML
aren't touched. A file with syntax errors is left alone.

It normalizes spaces, indentation, blank lines, brace placement, and one statement to a line. It doesn't wrap long lines:
line breaks inside expressions stay where they are, and lines continuing an expression keep their indentation relative to
its start. Alignment before `=` and `=>` stays, as PER-CS allows it. In files with HTML around their PHP, only the spaces
within lines change.

## An example

<<< @/examples/fmt/src/Point.php{php}

<<< @/examples/fmt/output/check.console{text}

<<< @/examples/fmt/output/stdin.console{text}

With tabs, writing the file:

<<< @/examples/fmt/output/indent.console{text}

<<< @/examples/fmt/output/check-after.console{text}

## Options

```sh
stirphp fmt                  # the project's sources
stirphp fmt src tests/A.php  # these files and folders
stirphp fmt --check          # change nothing, list what would change, and fail if anything would
stirphp fmt --indent tab     # or a number of spaces, over `parameters.stirphp.indent`
stirphp fmt -                # from standard input to standard output
```

The indentation is 4 spaces unless `parameters.stirphp.indent` or `--indent` says otherwise. In an editor, formatting a
document or a selection uses the editor's indentation unless the configuration sets one. It isn't configurable beyond
that, and it isn't PhpStorm-compatible: PER-CS is the style.

## How it was tested

Run over Laravel's framework, Symfony and PHPStan's source (about 54,000 files, some of them deliberately odd), tokens
didn't change, a second run changed nothing, and nothing that parsed stopped parsing.
