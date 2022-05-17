const INCLUDE_HEADER = "#!includes"

const canParse = (data) => (data && data.includes && data.includes(INCLUDE_HEADER))

const addLine = (result, line) => line.trim() === "" ? result : (result += line + "\n", result)

async function load(data = "", options = {
    loader: async () => {
        return ""
    }
}) {
    let result = ""
    for (let line of data.split('\n')) {
        if (!line.includes(INCLUDE_HEADER)) { result = addLine(result, line); continue }
        line = line.replace(INCLUDE_HEADER, "").trim()
        let content = await options.loader(line)
        if (canParse(content)) {
            content = await load(content, options)
        }
        result = addLine(result, content)
    }
    return result.trim()
}

module.exports = {
    canParse,
    load
}