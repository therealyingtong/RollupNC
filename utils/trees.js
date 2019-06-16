const merkle = require("./MiMCMerkle")


class Tree {
  constructor(leaves, depth) {
    this.leaves = leaves
    this.leafHashes = this.leaves.map(leaf => leaf.leafHash().toString())
    this.tree = merkle.treeFromLeafArray(this.leafHashes)
    this.root = this.tree[0][0]
    //TODO: Pad if necessary
    this.depth = depth
  }

  getProof(leafIndex) {
    return merkle.getProof(leafIndex, this.tree, this.leafHashes)
  }

  getLeafFieldArray(field) {
    return this.leaves.map(item => item[field])
  }
  everyMerkleProof() {
    return this.leaves.map((_, index) => this.getProof(index))
  }
  getMerklePosArray(){
    return merkle.generateMerklePosArray(this.depth)
  }

  idxToBinaryPos(leafIndex){
    return merkle.idxToBinaryPos(leafIndex)
  }

}

module.exports = {
  Tree,
}