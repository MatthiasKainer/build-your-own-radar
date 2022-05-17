const CsvIncludes = require('../../src/util/csvIncludes')

const example = {
    csvPlain: `name,ring,quadrant,context,description
Babel,adopt,tools,Software,test`,
    csvIncludes: `name,ring,quadrant,context,description
#!includes trial.csv
Babel,adopt,tools,Software,test`
}


describe("CSV Includes", () => {
    describe("can parse", () => {
        it("returns false if not a csv file with includes", () => {
            expect(CsvIncludes.canParse(example.csvPlain)).toBeFalse()
        })
        it("returns true if a csv file with includes", () => {
            expect(CsvIncludes.canParse(example.csvIncludes)).toBeTrue()
        })
    })

    describe("loads", () => {
        it("doesn't load if no csv file", async () => {
            const loader = jasmine.createSpy()
            loader.and.returnValue = "";
            const result = await CsvIncludes.load(example.csvPlain, { loader })
            expect(result).toBe(example.csvPlain)
            expect(loader.calls.count()).toBe(0)
        })

        it("loads a new file if included", async () => {
            const loader = jasmine.createSpy()
            const csv = "Apache Kafka,trial,languages & frameworks,DevOps,test";
            const result = await CsvIncludes.load(example.csvIncludes, { loader: loader.and.resolveTo(csv) })
            expect(result).toBe(`name,ring,quadrant,context,description
${csv}
Babel,adopt,tools,Software,test`)
            expect(loader.calls.count()).toBe(1)
        })
    })
})