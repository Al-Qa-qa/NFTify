import pinataSDK, { PinataPinResponse } from '@pinata/sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const pinataApiKey = process.env.PINATA_API_KEY || '';
const pinataApiSecret = process.env.PINATA_API_SECRET || '';
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath: string) {
  const fullImagesPath: string = path.resolve(imagesFilePath);

  // Filter the files in case the are a file that in not a .png
  const files: string[] = fs.readdirSync(fullImagesPath).filter((file) => file.includes('.png'));

  let responses: PinataPinResponse[] = [];
  console.log('Uploading to IPFS');

  for (const fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`);
    const options = {
      pinataMetadata: {
        name: files[fileIndex],
      },
    };
    try {
      await pinata
        .pinFileToIPFS(readableStreamForFile, options)
        .then((result: PinataPinResponse) => {
          responses.push(result);
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  }
  return { responses, files };
}

async function storeTokenUriMetadata(metadata: any) {
  const options = {
    pinataMetadata: {
      name: metadata.name,
    },
  };
  try {
    const response = await pinata.pinJSONToIPFS(metadata, options);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}

// async function do() {

//   await storeImages('./');

//   await storeTokenUriMetadata();
// }
