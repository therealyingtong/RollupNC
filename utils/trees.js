const merkle = require("./MiMCMerkle")


class Tree {
  constructor(items, depth) {
    this.items = items
    this.leaveHashes = this.items.map(item => item.leafHash().toString())
    this.tree = merkle.treeFromLeafArray(this.leaveHashes)
    this.root = this.tree[0][0]
    //TODO: Pad if necessary
    this.depth = depth
  }

  getProof(leafIndex) {
    return merkle.getProof(leafIndex, this.tree, this.leaveHashes)
  }

  getItemFieldArray(field) {
    return this.items.map(item => item[field])
  }
  everyMerkleProof() {
    return this.items.map((_, index) => this.getProof(index))
  }
  getMerklePosArray(){
    return merkle.generateMerklePosArray(this.depth)
  }

}

module.exports = {
  Tree,
}