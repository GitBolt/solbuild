import React, { useState, useEffect, FC } from "react";
import {
  fetchCandyMachine,
  fetchCandyGuard,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { NodeProps, useNodeId, useReactFlow, Connection as RCon } from "reactflow";
import BaseNode from "@/layouts/BaseNode";
import { CustomHandle } from "@/layouts/CustomHandle";
import { handleValue } from "@/util/handleNodeValue";
import { HXRO } from "@/sdks/hxro";
import { Box, Text, useClipboard } from "@chakra-ui/react";
import { SDKResponse } from "@/types/response";
import base58 from "bs58";
import { useNetworkContext } from "@/context/configContext";
import { PublicKey } from "@solana/web3.js";
import { publicKey } from "@metaplex-foundation/umi";
import { CheckIcon, CopyIcon } from "@chakra-ui/icons";
import { stringify } from "@/util/helper";


const GetCandyMachine: FC<NodeProps> = (props) => {
  const { getNode, getEdges, setNodes, setEdges } = useReactFlow();
  const id = useNodeId();
  const currentNode = getNode(id as string);
  const { selectedNetwork } = useNetworkContext()

  const [txId, setTxId] = useState<any>();
  const [error, setError] = useState<any>('');
  const [sigOutputs, setSigOutputs] = useState<string[]>([])
  const [data, setData] = useState<any>()
  const umi = createUmi(selectedNetwork).use(mplCandyMachine());
  const { hasCopied, onCopy } = useClipboard(data || '')


  const updateNodeData = (nodeId: string, data: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            [id as string]: data,
          };
        }
        return node;
      })
    );
  };


  useEffect(() => {
    sigOutputs.forEach((target) => updateNodeData(target, txId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txId, error]);


  useEffect(() => {
    const edges = getEdges();
    const values = handleValue(currentNode, edges, [
      "address",
    ]);
    if (!values["address"]) return;
    fetchCandyMachine(umi, publicKey(values["address"]))
      .then((res) => {
        setData(stringify(
          {
            authority: new PublicKey(new Uint8Array(res.authority.bytes)).toBase58(),
            collectionMint: new PublicKey(new Uint8Array(res.collectionMint.bytes)).toBase58(),
            data: {
              configLineSettings: res.data.configLineSettings,
              creators: res.data.creators.map((creator) => {
                return ({
                  address: new PublicKey(new Uint8Array(creator.address.bytes)).toBase58(),
                  percentageShare: creator.percentageShare,
                  verified: creator.verified,
                })
              })
            },
            discriminator: new PublicKey(new Uint8Array(res.discriminator)).toBase58(),
            items: res.items,
            itemsLoaded: res.itemsLoaded,
            itemsRedeemed: res.itemsRedeemed,
            mintAuthority: new PublicKey(new Uint8Array(res.authority.bytes)).toBase58(),
            publicKey: new PublicKey(new Uint8Array(res.publicKey.bytes)).toBase58(),
            tokenStandard: res.tokenStandard,
            version: res.version,
          })); console.log(res)
      })
      .catch((e) => setError(e.toString()))

    setEdges((edgs) =>
      edgs.map((ed) => {
        if (ed.source == id) {
          ed.animated = true;
          return ed;
        }
        return ed;
      })
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode?.data]);


  const CODE = `fetchCandyMachine(umi, publicKey(address)).then((res) => console.log(res))`;

  return (
    <BaseNode
      code={CODE}
      {...props}
      title="Candy Machine - Get"

    >
      {data ?
        <>
          <Text fontSize="1rem" color="blue.500" whiteSpace="pre-wrap" ml="4rem" my="2rem">{data.toLocaleString()}</Text>
          <Box pos="absolute" top="3rem" right="1rem">
            {hasCopied ? <CheckIcon color="blue.200" w="1.5rem" h="1.5rem" /> :
              <CopyIcon onClick={onCopy} color="blue.200" w="1.5rem" h="1.5rem" />}
          </Box>
        </>
        :
        <Text color="blue.300" opacity="50%" fontSize="1.5rem">{error || 'Empty...'}</Text>}

      {error ?
        <Text fontSize="1.5rem" transform="translate(7rem, 3rem)" mr="10rem" zIndex="3" color="blue.400" maxW="30rem" fontWeight={600}>{error.toLocaleString()}</Text> : null}
      <CustomHandle
        pos="left"
        type="target"
        id="address"
        label="Address"
      />
    </BaseNode>
  );
};

export default GetCandyMachine;
