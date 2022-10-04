const CsvIncludes = require('../../src/util/csvIncludes')

const example = {
    csvPlain: `name,ring,quadrant,context,description
Babel,adopt,tools,Software,test`,
    csvIncludes: `name,ring,quadrant,context,description
#!includes trial.csv
Babel,adopt,tools,Software,test`,
    csvIncludesAndTranforms: `name,ring,quadrant,context,description
#!includes !transforms($[0], trial, $[1], Software, $[2]) trial.csv
Babel,adopt,tools,Software,test`
}


describe("csv reader", () => {
    it("splits a simple line correctly", () => {
        expect(CsvIncludes.split("Babel,adopt,tools,Software,test")).toEqual(["Babel", "adopt", "tools", "Software", "test"])
    })
    it("splits a line with a blocked string correctly", () => {
        expect(CsvIncludes.split("Babel,adopt,tools,Software,\"test, or don't, but i do\"")).toEqual(["Babel", "adopt", "tools", "Software", "test, or don't, but i do"])
    })
    it("splits a line with a blocked string and escaped quotes correctly", () => {
        expect(CsvIncludes.split(`Babel,adopt,tools,Software,"test, or don\\"t, but i do"`)).toEqual(["Babel", "adopt", "tools", "Software", "test, or don\\\"t, but i do"])
    })
})

describe("CSV Includes", () => {
    describe("can parse", () => {
        it("returns false if not a csv file with includes", () => {
            expect(CsvIncludes.canParse(example.csvPlain)).toBeFalse()
        })
        it("returns true if a csv file with includes", () => {
            expect(CsvIncludes.canParse(example.csvIncludes)).toBeTrue()
        })
    })

    describe("transformation", () => {
        it("does not apply on a line without a transformation", () => {
            const transform = CsvIncludes.transform({ line: "hello world" })
            expect(transform.apply).toBe(false)
        })

        it("applies a transformation for a line that has the directive", () => {
            const transform = CsvIncludes.transform({ line: " !transforms($[0], trial, $[1], Software(), $[2]) trial.csv" })
            expect(transform.apply).not.toBe(false)
            expect(transform.apply(`one, two, "three, three", four`)).toBe(`one, trial, two, Software(), "three, three"`)
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

        it("loads a new file if included, removing empty lines", async () => {
            const loader = jasmine.createSpy()
            const csv = "Apache Kafka,trial,languages & frameworks,DevOps,test";
            const result = await CsvIncludes.load(example.csvIncludes, { loader: loader.and.resolveTo("\n" + csv + "\n") })
            expect(result).toBe(`name,ring,quadrant,context,description
${csv}
Babel,adopt,tools,Software,test`)
            expect(loader.calls.count()).toBe(1)
        })

        it("loads a new file if included, and applies transformations", async () => {
            const loader = jasmine.createSpy()
            const csv = `Apache Kafka,"languages, frameworks",test
Apache Kafka,languages & frameworks,test`;
            const result = await CsvIncludes.load(example.csvIncludesAndTranforms, { loader: loader.and.resolveTo(csv) })
            expect(result).toBe(`name,ring,quadrant,context,description
Apache Kafka,trial,"languages, frameworks",Software,test
Apache Kafka,trial,languages & frameworks,Software,test
Babel,adopt,tools,Software,test`)
            expect(loader.calls.count()).toBe(1)
        })
    })
})