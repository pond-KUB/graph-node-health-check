import { gql, GraphQLClient } from "graphql-request";

const query = gql`
  {
    indexingStatusForCurrentVersion(subgraphName: "bitkubchain/pos") {
      subgraph
      synced
      health
      node
      chains {
        latestBlock {
          number
        }
        chainHeadBlock {
          number
        }
        network
      }
      entityCount
      nonFatalErrors {
        message
        block {
          hash
          number
        }
        handler
        deterministic
      }
      fatalError {
        message
        handler
      }
    }
  }
`;

const getGraphNodeBlockDetail = async (url) => {
  const graphQLClient = new GraphQLClient(url);

  const results = await graphQLClient.request(query);

  return results["indexingStatusForCurrentVersion"]["chains"][0];
};

export default getGraphNodeBlockDetail;
