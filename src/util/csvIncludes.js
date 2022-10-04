const INCLUDE_HEADER = "#!includes"

const canParse = (data) => (data && data.includes && data.includes(INCLUDE_HEADER))

const addLine = (result, line) => line.trim() === "" ? result : (result += line + "\n", result)

const split = (line = "") => {
    const explode = []
    let current = ""
    let inBlock = false, escaped = false
    for (const char of line) {
        if (inBlock && !escaped && char === '"') {
            inBlock = false
        } else if (char === "\\") {
            current += char
            escaped = true
        } else if (escaped) {
            current += char
            escaped = false
        } else if (char === '"') {
            inBlock = true
        } else if (!inBlock && char === ",") {
            explode.push(current.trim())
            current = ""
        } else {
            current += char
        }
    }
    explode.push(current.trim())
    return explode
}

const transform = ({ line = "" }) => {
    // works on a slot in the format: #!includes !transforms($[0], trial, $[1], Software, $[2]) trial.csv
    if (!line.includes("!transforms")) return { apply: false, line }

    let template = ""
    const apply = (value) => {
        let result = template;
        const fit = (slot = "") => slot.includes(",") ? `"${slot.trim()}"` : slot.trim()

        split(value).forEach((slot, index) => {
            result = result.replace(new RegExp(`\\$\\[${index}\\]`, "gi"), fit(slot))
        })
        return result
    }

    let state = "SEARCH"
    let intend = 0
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        switch (state) {
            case "SEARCH":
                if (char === "!" && line.substr(charIndex + 1, 10) === "transforms") {
                    state = "BLOCK:START";
                    charIndex = charIndex + 10
                }
                break;
            case "BLOCK:START":
                if (char === "(") {
                    state = "BLOCK"
                }
                break;
            case "BLOCK":
                if (char === "(") {
                    template += char
                    intend++;
                } else if (char === ")" && intend > 0) {
                    template += char
                    intend = Math.max(intend - 1, 0)
                } else if (char === ")") {
                    line = line.substr(charIndex + 1).trim()
                    return { line, apply }
                } else {
                    template += char
                }
                break;
        }
    }
    return { line, apply }
}

const applyDirectives = async (line, load) => {
    const directives = [transform]
    const preparedDirectives = directives.reduce((result, directive) => {
        const curr = directive({ line: result.line })
        result.line = curr.line
        result.directives.push(curr)
        return result
    }, { line, directives: [] })
    const content = await load(preparedDirectives.line)
    const lines = []
    for (const line of content.split('\n').filter(line => line.trim() !== "")) {
        lines.push(preparedDirectives.directives.reduce((result, directive) => {
            return directive.apply === false ? result : directive.apply(result)
        }, line))
    }
    return lines.join('\n')
}

async function load(data = "", options = {
    loader: async () => {
        return ""
    }
}) {
    let result = ""
    for (let line of data.split('\n')) {
        if (!line.includes(INCLUDE_HEADER)) { result = addLine(result, line); continue }
        line = split(line.replace(INCLUDE_HEADER, "").trim()).join(",")

        let content = await applyDirectives(line, options.loader)
        if (canParse(content)) {
            content = await load(content, options)
        }
        result = addLine(result, content)
    }
    return result.trim()
}

module.exports = {
    canParse,
    split,
    load,
    transform
}