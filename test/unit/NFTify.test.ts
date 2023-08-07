import { assert, expect } from 'chai';
import { network, ethers } from 'hardhat';

// Function
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

// Data
import { developmentChains } from '../../helper-hardhat-config';

// Types
import {
  BasicNft,
  BasicNft__factory,
  NFTify as NftMarketplace,
  NFTify__factory as NftMarketplace__factory,
} from '../../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

// ---------------

describe.only('NftMarketplace', function () {
  beforeEach(async () => {
    if (!developmentChains.includes(network.name)) {
      throw new Error('You need to be on a development chain to run unit tests');
    }
  });

  const PRICE: BigNumber = ethers.utils.parseEther('0.1');
  const TOKEN_ID: number = 0;

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  type DeployFixture = {
    deployer: SignerWithAddress;
    nftMarketplace: NftMarketplace;
    basicNft: BasicNft;
  };
  async function deployNftMarketplaceFixture(): Promise<DeployFixture> {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();

    const nftMarketplaceFactory: NftMarketplace__factory = await ethers.getContractFactory(
      'NFTify'
    );
    const nftMarketplace: NftMarketplace = await nftMarketplaceFactory.connect(deployer).deploy();

    const basicNftFactory: BasicNft__factory = await ethers.getContractFactory('BasicNft');
    const basicNft: BasicNft = await basicNftFactory.connect(deployer).deploy();

    // Approve BasicNft to the nftMarketplace
    await basicNft.mintNft();
    await basicNft.approve(nftMarketplace.address, TOKEN_ID);

    return { deployer, nftMarketplace, basicNft };
  }

  describe('deployment', () => {
    it('should be initialized correctly, and no items are listed in the beginning', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const bassicNftToken0: NftMarketplace.ListingStructOutput = await nftMarketplace.getListing(
        basicNft.address,
        TOKEN_ID
      );

      assert.equal(bassicNftToken0.seller, ethers.constants.AddressZero);
    });
  });

  describe('#listItem', () => {
    it('should revert if the item is already listed', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      // List the item
      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      // It reverts if we tried to list item again
      await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith(
        /NFTify: this item is already listed/
      );
    });

    it('should revert if not the owner is trying to list the item', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, hacker]: SignerWithAddress[] = await ethers.getSigners();

      await expect(
        nftMarketplace.connect(hacker).listItem(basicNft.address, TOKEN_ID, PRICE)
      ).to.be.revertedWith(/ERC721: you are not the owner of this item/);
    });

    it('should reverts it the price is 0', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);
      await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)).to.be.revertedWith(
        /NFTify: price must be above zero/
      );
    });

    it('should reverts the marketplace is not approved to this nft', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await basicNft.mintNft();
      const tokenCounter: BigNumber = await basicNft.getTokenCounter();

      await expect(
        nftMarketplace.listItem(basicNft.address, tokenCounter.sub(1), PRICE)
      ).to.be.revertedWith(/ERC721: NFTify don't have access to this item/);
    });

    it('should emit ItemListed event on sucessfull listing item', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await expect(nftMarketplace.connect(deployer).listItem(basicNft.address, TOKEN_ID, PRICE))
        .to.emit(nftMarketplace, 'ItemListed')
        .withArgs(deployer.address, basicNft.address, TOKEN_ID, PRICE);
    });

    it('should add the items to our listing', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await nftMarketplace.connect(deployer).listItem(basicNft.address, TOKEN_ID, PRICE);

      const listing: NftMarketplace.ListingStructOutput = await nftMarketplace.getListing(
        basicNft.address,
        TOKEN_ID
      );

      assert.equal(listing.seller, deployer.address);
      expect(listing.price.eq(PRICE));
    });

    it('should work correctly if its approved to all NFTs', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await basicNft.setApprovalForAll(nftMarketplace.address, true);

      await basicNft.mintNft();
      const tokenCounter: BigNumber = await basicNft.getTokenCounter();

      await basicNft.isApprovedForAll(deployer.address, nftMarketplace.address);

      await expect(nftMarketplace.listItem(basicNft.address, tokenCounter.sub(1), PRICE))
        .to.emit(nftMarketplace, 'ItemListed')
        .withArgs(deployer.address, basicNft.address, tokenCounter.sub(1), PRICE);
    });
  });

  describe('#cancelListing', () => {
    it('reverts if the connector is not the owner', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, hacker]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.connect(deployer).listItem(basicNft.address, TOKEN_ID, PRICE);

      await expect(
        nftMarketplace.connect(hacker).cancelListing(basicNft.address, TOKEN_ID)
      ).to.be.revertedWith(/ERC721: you are not the owner of this item/);
    });

    it('reverts if the item is not listed', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await basicNft.mintNft();
      const tokenCounter: BigNumber = await basicNft.getTokenCounter();

      await expect(
        nftMarketplace.connect(deployer).cancelListing(basicNft.address, tokenCounter.sub(1))
      ).to.be.revertedWith(/NFTify: this item is not listed/);
    });

    it('it emits ItemCanceled event', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await expect(nftMarketplace.cancelListing(basicNft.address, TOKEN_ID))
        .to.emit(nftMarketplace, 'ItemCanceled')
        .withArgs(deployer.address, basicNft.address, TOKEN_ID);
    });

    it('it removes the items from listings', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID);

      const listing: NftMarketplace.ListingStructOutput = await nftMarketplace.getListing(
        basicNft.address,
        TOKEN_ID
      );

      assert.equal(listing.seller, ethers.constants.AddressZero);
      expect(listing.price.eq(0));
    });
  });

  describe('#buyItem', () => {
    it('reverts if the item is not listed', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await expect(
        nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
      ).to.be.revertedWith(/NFTify: this item is not listed/);
    });

    it('reverts if the buyer price is lessthan the nft listed price', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      const listingPrice: NftMarketplace.ListingStructOutput = await nftMarketplace.getListing(
        basicNft.address,
        TOKEN_ID
      );

      await expect(
        nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: 0 })
      ).to.be.revertedWith(/NFTify: you didn't pay enough ETH/);
    });

    it('adds balance to the seller (in process mapping)', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: PRICE });

      const sellerBalance: BigNumber = await nftMarketplace.getProceeds(deployer.address);

      expect(sellerBalance.eq(PRICE));
    });

    it('removes the item from listings', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: PRICE });

      const removedListedItem: NftMarketplace.ListingStructOutput = await nftMarketplace.getListing(
        basicNft.address,
        TOKEN_ID
      );

      assert.equal(removedListedItem.seller, ethers.constants.AddressZero);
      expect(removedListedItem.price.eq(0));
    });

    it('emits ItemBought event', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await expect(
        nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
      )
        .to.emit(nftMarketplace, 'ItemBought')
        .withArgs(buyer.address, basicNft.address, TOKEN_ID, PRICE); // Its not good to hard code the PRICE
    });

    it('updates the balance of the seller', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: PRICE });

      const sellerBalance: BigNumber = await nftMarketplace.getProceeds(deployer.address);

      expect(sellerBalance.eq(PRICE));
    });

    it('transferes the item from the seller to the buyer', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: PRICE });

      const sellerBalance: BigNumber = await nftMarketplace.getProceeds(deployer.address);

      const itemOwner: string = await basicNft.ownerOf(TOKEN_ID);

      assert.equal(itemOwner, buyer.address);
    });
  });

  describe('#updateListing', () => {
    it('reverts if the item is not listed yet', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await expect(
        nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE.mul(2))
      ).to.be.revertedWith(/NFTify: this item is not listed/);
    });

    it('reverts if not the owner is trying to update list', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, hacker]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.connect(deployer).listItem(basicNft.address, TOKEN_ID, PRICE);

      await expect(
        nftMarketplace.connect(hacker).updateListing(basicNft.address, TOKEN_ID, PRICE.mul(2))
      ).to.be.revertedWith(/ERC721: you are not the owner of this item/);
    });

    it('reverts if the new price is 0', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await expect(nftMarketplace.updateListing(basicNft.address, TOKEN_ID, 0)).to.be.revertedWith(
        /NFTify: price must be above zero/
      );
    });

    it('updates the new price of the listing', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      const newPrice: BigNumber = PRICE.mul(2);

      await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice);

      const updateditem: NftMarketplace.ListingStructOutput = await nftMarketplace.getListing(
        basicNft.address,
        TOKEN_ID
      );

      assert.equal(updateditem.seller, deployer.address);
      expect(updateditem.price.eq(newPrice));
    });

    it('emits ItemListed event', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      const newPrice: BigNumber = PRICE.mul(2);

      await expect(nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice))
        .to.emit(nftMarketplace, 'ItemListed')
        .withArgs(deployer.address, basicNft.address, TOKEN_ID, newPrice);
    });
  });

  describe('#withdrawProceeds', () => {
    it('reverts if the withdrawer balance is zero', async () => {
      const { nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);

      await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
        /NFTify: you don't have any earnings/
      );
    });

    it('makes the withdrawer balance rqual zero in successful withdrawing', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.connect(deployer).listItem(basicNft.address, TOKEN_ID, PRICE);

      await nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: PRICE });

      const sellerBalanceBeforeWithdrawing: BigNumber = await nftMarketplace.getProceeds(
        deployer.address
      );

      await nftMarketplace.connect(deployer).withdrawProceeds();

      const sellerBalanceAfterWithdrawing: BigNumber = await nftMarketplace.getProceeds(
        deployer.address
      );

      expect(sellerBalanceBeforeWithdrawing.eq(PRICE));
      expect(sellerBalanceAfterWithdrawing.eq(0));
    });

    it('increases the balance of the withdrawer', async () => {
      const { deployer, nftMarketplace, basicNft } = await loadFixture(deployNftMarketplaceFixture);

      const [, buyer]: SignerWithAddress[] = await ethers.getSigners();

      await nftMarketplace.connect(deployer).listItem(basicNft.address, TOKEN_ID, PRICE);

      const sellerBalanceBeforeBuying: BigNumber = await ethers.provider.getBalance(
        deployer.address
      );

      await nftMarketplace.connect(buyer).buyItem(basicNft.address, TOKEN_ID, { value: PRICE });

      const withdrawTxResponse = await nftMarketplace.connect(deployer).withdrawProceeds();

      // Getting the gas cost of this transaction
      const withdrawTxReceipt = await withdrawTxResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = withdrawTxReceipt;
      const gasCost: BigNumber = gasUsed.mul(effectiveGasPrice);

      const sellerBalanceAfterBuying: BigNumber = await ethers.provider.getBalance(
        deployer.address
      );

      // The difference between the deployer balance after withdrawing and before withdrawing should equal (0.1 ETH) if we supposed that gasCost is zero
      expect(sellerBalanceAfterBuying.sub(sellerBalanceBeforeBuying).add(gasCost));
    });
  });
});
