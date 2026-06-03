"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { isValidAddress } from '../../lib/contractUtils';
import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface NFTMarketplaceProps {
  astrodexNFTAddress: string;
  astrodexMarketplaceAddress: string;
  tokenA: string;
  tokenB: string;
}

interface NFT {
  id: number;
  owner: string;
  price: string;
  isListed: boolean;
  metadata: string;
}

export function NFTMarketplace({ astrodexNFTAddress, astrodexMarketplaceAddress, tokenA, tokenB }: NFTMarketplaceProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [mintAmount, setMintAmount] = useState("1");

  // NFT and Marketplace ABI (simplified)
  const nftAbi = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function tokenURI(uint256 tokenId) external view returns (string)",
    "function mint(address to, uint256 amount) external",
    "function approve(address to, uint256 tokenId) external",
    "function transferFrom(address from, address to, uint256 tokenId) external",
  ];

  const marketplaceAbi = [
    "function listNFT(uint256 tokenId, uint256 price) external",
    "function buyNFT(uint256 tokenId) external payable",
    "function cancelListing(uint256 tokenId) external",
    "function getListing(uint256 tokenId) external view returns (address seller, uint256 price, bool active)",
    "function getAllListings() external view returns (uint256[] memory)",
  ];

  useEffect(() => {
    if (isConnected && address) {
      loadNFTs();
      loadUserNFTs();
    }
  }, [isConnected, address]);

  const loadNFTs = async () => {
    if (!walletClient) return;

    try {
      if (!isValidAddress(astrodexMarketplaceAddress)) {
        console.warn('NFTMarketplace: invalid marketplace address, skipping loadNFTs', astrodexMarketplaceAddress);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const marketplaceContract = new ethers.Contract(astrodexMarketplaceAddress, marketplaceAbi, provider);

      const listingIds = await marketplaceContract.getAllListings();

      const nftData: NFT[] = [];
      for (const tokenId of listingIds) {
        const listing = await marketplaceContract.getListing(tokenId);

        if (listing[2]) { // active listing
          nftData.push({
            id: Number(tokenId),
            owner: listing[0],
            price: ethers.formatEther(listing[1]),
            isListed: true,
            metadata: `AstroDEX NFT #${tokenId}`,
          });
        }
      }

      setNfts(nftData);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    }
  };

  const loadUserNFTs = async () => {
    if (!walletClient || !address) return;

    try {
      if (!isValidAddress(astrodexNFTAddress)) {
        console.warn('NFTMarketplace: invalid NFT address, skipping loadUserNFTs', astrodexNFTAddress);
        return;
      }
      if (!isValidAddress(astrodexMarketplaceAddress)) {
        console.warn('NFTMarketplace: invalid marketplace address, skipping loadUserNFTs', astrodexMarketplaceAddress);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const nftContract = new ethers.Contract(astrodexNFTAddress, nftAbi, provider);

      const balance = await nftContract.balanceOf(address);
      const userNFTsData: NFT[] = [];

      // Assuming NFTs are sequential from 1
      for (let i = 1; i <= Math.min(balance, 10); i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === address.toLowerCase()) {
            const marketplaceContract = new ethers.Contract(astrodexMarketplaceAddress, marketplaceAbi, provider);
            const listing = await marketplaceContract.getListing(i);

            userNFTsData.push({
              id: i,
              owner: address,
              price: listing[2] ? ethers.formatEther(listing[1]) : "0",
              isListed: listing[2],
              metadata: `AstroDEX NFT #${i}`,
            });
          }
        } catch (e) {
          // NFT might not exist or not owned by user
        }
      }

      setUserNFTs(userNFTsData);
    } catch (error) {
      console.error("Error loading user NFTs:", error);
    }
  };

  const handleMint = async () => {
    if (!walletClient || !address) return;

    setIsLoading(true);
    try {
      if (!isValidAddress(astrodexNFTAddress)) {
        alert('NFT contract address missing or invalid');
        setIsLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const nftContract = new ethers.Contract(astrodexNFTAddress, nftAbi, signer);

      const mintTx = await nftContract.mint(address, mintAmount);
      await mintTx.wait();

      setMintAmount("1");
      await loadUserNFTs();

      alert("NFT minted successfully!");
    } catch (error) {
      console.error("Mint failed:", error);
      alert("Mint failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleList = async () => {
    if (!walletClient || !address || selectedNFT === null || !price) return;

    setIsLoading(true);
    try {
      if (!isValidAddress(astrodexNFTAddress) || !isValidAddress(astrodexMarketplaceAddress)) {
        alert('NFT or Marketplace contract address missing or invalid');
        setIsLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const nftContract = new ethers.Contract(astrodexNFTAddress, nftAbi, signer);
      const marketplaceContract = new ethers.Contract(astrodexMarketplaceAddress, marketplaceAbi, signer);

      // Approve marketplace
      const approveTx = await nftContract.approve(astrodexMarketplaceAddress, selectedNFT);
      await approveTx.wait();

      // List NFT
      const priceWei = ethers.parseEther(price);
      const listTx = await marketplaceContract.listNFT(selectedNFT, priceWei);
      await listTx.wait();

      setPrice("");
      setSelectedNFT(null);
      await loadNFTs();
      await loadUserNFTs();

      alert("NFT listed successfully!");
    } catch (error) {
      console.error("List failed:", error);
      alert("List failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (tokenId: number, price: string) => {
    if (!walletClient || !address) return;

    setIsLoading(true);
    try {
      if (!isValidAddress(astrodexMarketplaceAddress)) {
        alert('Marketplace contract address missing or invalid');
        setIsLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const marketplaceContract = new ethers.Contract(astrodexMarketplaceAddress, marketplaceAbi, signer);

      const priceWei = ethers.parseEther(price);
      const buyTx = await marketplaceContract.buyNFT(tokenId, { value: priceWei });
      await buyTx.wait();

      await loadNFTs();
      await loadUserNFTs();

      alert("NFT purchased successfully!");
    } catch (error) {
      console.error("Buy failed:", error);
      alert("Buy failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelListing = async (tokenId: number) => {
    if (!walletClient || !address) return;

    setIsLoading(true);
    try {
      if (!isValidAddress(astrodexMarketplaceAddress)) {
        alert('Marketplace contract address missing or invalid');
        setIsLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const marketplaceContract = new ethers.Contract(astrodexMarketplaceAddress, marketplaceAbi, signer);

      const cancelTx = await marketplaceContract.cancelListing(tokenId);
      await cancelTx.wait();

      await loadNFTs();
      await loadUserNFTs();

      alert("Listing cancelled!");
    } catch (error) {
      console.error("Cancel failed:", error);
      alert("Cancel failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">NFT Marketplace</h2>
          <p className="text-gray-600 mb-4">Connect your wallet to access NFT features</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">NFT Marketplace</h2>

      {/* Mint NFT */}
      <div className="border rounded-lg p-4 mb-8">
        <h3 className="font-semibold mb-4">Mint New NFT</h3>
        <div className="flex gap-4">
          <input
            type="number"
            min="1"
            max="10"
            placeholder="Amount to mint"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            className="p-2 border rounded flex-1"
          />
          <button
            onClick={handleMint}
            disabled={isLoading}
            className="bg-purple-600 text-white py-2 px-6 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? "Minting..." : "Mint NFT"}
          </button>
        </div>
      </div>

      {/* List NFT */}
      <div className="border rounded-lg p-4 mb-8">
        <h3 className="font-semibold mb-4">List Your NFT</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedNFT || ""}
            onChange={(e) => setSelectedNFT(Number(e.target.value))}
            className="p-2 border rounded"
          >
            <option value="">Select NFT</option>
            {userNFTs.filter(nft => !nft.isListed).map((nft) => (
              <option key={nft.id} value={nft.id}>
                NFT #{nft.id}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Price in TokenA"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={handleList}
            disabled={isLoading || !selectedNFT || !price}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Listing..." : "List NFT"}
          </button>
        </div>
      </div>

      {/* Marketplace */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Marketplace</h3>
        {nfts.length === 0 ? (
          <p className="text-gray-500">No NFTs listed for sale</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div key={nft.id} className="border rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">#{nft.id}</span>
                  </div>
                  <p className="font-semibold">{nft.metadata}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p>Price: {nft.price} TokenA</p>
                  <p className="text-gray-500">Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}</p>
                </div>
                <button
                  onClick={() => handleBuy(nft.id, nft.price)}
                  disabled={isLoading}
                  className="w-full mt-3 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Buying..." : "Buy NFT"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your NFTs */}
      {userNFTs.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Your NFTs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userNFTs.map((nft) => (
              <div key={nft.id} className="border rounded-lg p-4 bg-blue-50">
                <div className="text-center mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">#{nft.id}</span>
                  </div>
                  <p className="font-semibold">{nft.metadata}</p>
                </div>
                {nft.isListed ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">Listed for {nft.price} TokenA</p>
                    <button
                      onClick={() => handleCancelListing(nft.id)}
                      disabled={isLoading}
                      className="w-full bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Cancel Listing
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedNFT(nft.id)}
                    className="w-full bg-gray-600 text-white py-1 px-3 rounded text-sm hover:bg-gray-700"
                  >
                    List for Sale
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}