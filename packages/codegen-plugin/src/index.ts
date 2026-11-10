import { extname } from 'node:path';
import {
  type PluginFunction,
  type PluginInfo,
  type PluginValidateFn,
} from '@graphql-codegen/plugin-helpers';
import { Kind, OperationTypeNode, type OperationDefinitionNode } from 'graphql';
import { createMutationProcessor, mutationDependecies } from './mutation.js';
import { createQueryProcessor, queryDependecies } from './query.js';
import { uniqueArray } from './utils.js';

const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];

// codegen 7+ loads plugins with ESM `import` and reads the named `plugin` export.
// The plugin only works with near-operation-file, so it receives one document file at a time.
// TODO: Support multiple documents
export const plugin: PluginFunction = (schema, [documentFile]) => {
  if (!documentFile) {
    return '';
  }
  const { document } = documentFile;
  if (!document) {
    return '';
  }

  const queryType = schema.getQueryType();
  if (!queryType) {
    return '';
  }

  const operations = document.definitions.filter(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === Kind.OPERATION_DEFINITION,
  );

  const queryFields = queryType.getFields();
  const queryContents = operations
    .filter(({ operation }) => operation === OperationTypeNode.QUERY)
    .map(createQueryProcessor(queryFields))
    .filter((content): content is string => content !== undefined);

  const mutationContents = operations
    .filter(({ operation }) => operation === OperationTypeNode.MUTATION)
    .map(createMutationProcessor())
    .filter((content): content is string => content !== undefined);

  const hasQueries = queryContents.length > 0;
  const hasMutations = mutationContents.length > 0;

  return {
    prepend: uniqueArray([
      ...(hasQueries ? queryDependecies : []),

      ...(hasMutations ? mutationDependecies : []),
    ]),
    content: [...queryContents, ...mutationContents].join('\n'),
  };
};

// codegen 8 passes an info object as the fourth argument. codegen 7 passes the output file path.
export const validate: PluginValidateFn = (
  _schema,
  _documents,
  _config,
  info: PluginInfo | string,
) => {
  const outputFile = typeof info === 'string' ? info : info.outputFile;
  if (!SUPPORTED_EXTENSIONS.includes(extname(outputFile))) {
    const supportedExtensions = SUPPORTED_EXTENSIONS.join(', ');
    throw new Error(
      `Plugin "@dreamonkey/graphql-codegen-vue-apollo-plugin" requires the output file extension to be one of: ${supportedExtensions}. Received: ${outputFile}`,
    );
  }
};
