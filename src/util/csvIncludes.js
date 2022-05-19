const INCLUDE_HEADER = "#!includes"

const canParse = (data) => (data && data.includes && data.includes(INCLUDE_HEADER))

const addLine = (result, line) => line.trim() === "" ? result : (result += line + "\n", result)

const transform = ({ line = "" }) => {
    if (!line.includes("!transforms")) return { apply: false, line }

    let template = ""
    const apply = (value) => {
        let result = template;
        value.split(",").forEach((slot, index) => {
            result = result.replace(new RegExp(`\\$\\[${index}\\]`, "gi"), slot.trim())
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
    for (let line of content.split('\n')) {
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
        line = line.replace(INCLUDE_HEADER, "").trim()

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
    load,
    transform
}