const compiler = require('circom');


describe("circom", ()=>{
    it("should compile", async()=>{
        const cirDef = await compiler("snark_circuit/if-gadgets.circom")

    })
})