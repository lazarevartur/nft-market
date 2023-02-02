const NftMarket = artifacts.require("NftMarket");
const {ethers} = require('ethers')

contract("NftMarket", accounts => {
  let _contract = null;
  let _nftPrice = ethers.utils.parseEther('0.3').toString()
  let _listingPrice = ethers.utils.parseEther('0.025').toString()

  before(async () => {
    _contract = await NftMarket.deployed();
  })

  describe("Mint token", () => {
    const tokenURI = "https://test.com";
    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice
      })
    })

    it("price should be at least 1 wei", async () => {
      try {
        await _contract.mintToken(tokenURI, 0, {
          from: accounts[0],
        })
      } catch (e) {
        assert(!!e, 'Price less than 1 wei');
      }
    })

    it("owner of the first token should be address[0]", async () => {
      const owner = await _contract.ownerOf(1);
      assert.equal(owner, accounts[0], "Owner of token is not matching address[0]");
    })

    it("first token should point to correct uri ", async () => {
      const actualUri = await _contract.tokenURI(1);
      assert.equal(actualUri, tokenURI, "Token is not correctly set");
    })

    it("should be possible to create used tokenURI ", async () => {
      try {
        await _contract.mintToken(tokenURI, _nftPrice, {
          from: accounts[0]
        })
      } catch (e) {
        assert(e, 'NFT was minted with previously used tokenURI');
      }
    })

    it("should have one listed item ", async () => {
      const listedItemCount = await _contract.listedItemsCount();
      assert.equal(listedItemCount.toNumber(), 1, "listed item count is not 1");
    })

    it("should have create nft item ", async () => {
      const nft = await _contract.getNftItem(1);

      assert.equal(nft.tokenId, 1, "Token id is not 1");
      assert.equal(nft.price, _nftPrice, "Nft price is not correct");
      assert.equal(nft.creator, accounts[0], "Creator is not account[0]");
      assert.equal(nft.isListed, true, "token is not listed");
    })

  })

  describe("Buy Nft", () => {

    before(async () => {
      await _contract.buyNft(1, {
        from: accounts[1],
        value: _nftPrice
      })
    })

    it('should unlist the item', async () => {
      const nftItem = await _contract.getNftItem(1)
      assert.equal(nftItem.isListed, false, 'Item is still listed')
    })

    it('should decrease the listed item count', async () => {
      const listedItemsCount = await _contract.listedItemsCount()
      assert.equal(listedItemsCount.toNumber(), 0, 'item count not decreased')
    })

    it('should change the owner', async () => {
      const currentOwner = await _contract.ownerOf(1)
      assert.equal(currentOwner, accounts[1], 'Owner not changed')
    })

  })

  describe('Token Transfer', () => {
    const tokenUri = 'https://test-json-2.com'

    before(async () => {
      await _contract.mintToken(tokenUri, _nftPrice, {
        from: accounts[0],
        value: _listingPrice
      })
    })

    it('should have two NFTs created', async () => {
      const totalSupply = await _contract.totalSupply()
      assert.equal(totalSupply.toNumber(), 2, 'Total supply of token is not correct')
    })

    it('should be able to retrieve nft by index ', async () => {
      const nftId1 = await _contract.tokenByIndex(0)
      const nftId2 = await _contract.tokenByIndex(1)

      assert.equal(nftId1.toNumber(), 1, 'Nft1 id is wrong')
      assert.equal(nftId2.toNumber(), 2, 'Nft2 id is wrong')
    })

    it('should have two NFTs created', async () => {
      const nfts = await _contract.getAllNftsOnSale()

      assert.equal(nfts[0].tokenId, 2, 'NFTs nas wrong id')
    })

    it('account[1] should have one owned nft', async () => {
      const ownedNfts = await _contract.getOwnedNfts({from: accounts[1]})
      assert.equal(ownedNfts[0].tokenId, 1, 'NFTs nas wrong id')
    })

    it('account[0] should have one owned nft', async () => {
      const ownedNfts = await _contract.getOwnedNfts({from: accounts[0]})
      assert.equal(ownedNfts[0].tokenId, 2, 'NFTs nas wrong id')
    })
  })

  describe('Token transfer to new owner', () => {
    before(async () => {
      await _contract.transferFrom(accounts[0], accounts[1], 2)
    })

    it('account[0] should own 0 tokens', async () => {
      const ownedNfts = await _contract.getOwnedNfts({from: accounts[0]})
      assert.equal(ownedNfts.length, 0, 'Invalid length tokens')
    })

    it('account[1] should own 2 tokens', async () => {
      const ownedNfts = await _contract.getOwnedNfts({from: accounts[1]})
      assert.equal(ownedNfts.length, 2, 'Invalid length tokens')
    })
  })

  // describe('burn token', () => {
  //   before(async () => {
  //     const tokenURI = "https://tes3t.com";
  //     await _contract.mintToken(tokenURI, _nftPrice, {
  //       from: accounts[2], value: _listingPrice
  //     })
  //   })
  //
  //   it('account[2] should have one owned nft', async () => {
  //     const ownedNfts = await _contract.getOwnedNfts({from: accounts[2]})
  //     assert.equal(ownedNfts[0].tokenId, 3, 'NFTs nas wrong id')
  //   })
  //
  //
  //   it('account[2] should have own 0 nft', async () => {
  //     await _contract.burnToken(3, {from: accounts[2]})
  //     const ownedNfts = await _contract.getOwnedNfts({from: accounts[2]})
  //     assert.equal(ownedNfts.length, 0, 'Invalid length tokens')
  //   })
  // })

  describe('List an Nft', () => {
    before(async () => {
      await _contract.placeNftOnSale(1, _nftPrice, {
        from: accounts[1], value: _listingPrice
      })
    })

    it('should have 2 nft listed items', async () => {
      const listedNfts = await _contract.getAllNftsOnSale()
      assert.equal(listedNfts.length, 2, 'invalid length nfts')
    })
    it('should set new listing price', async () => {
      await _contract.setListingPrice(_listingPrice, {from: accounts[0]})
      const listingPrice = _contract.listingPrice()
      assert.equal(listingPrice.toString(), listingPrice, 'invalid length nfts')
    })
  })


})
