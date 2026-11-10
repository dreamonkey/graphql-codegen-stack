import {
  type CodegenPlugin,
  type PluginFunction,
} from '@graphql-codegen/plugin-helpers';
import { Kind, OperationTypeNode, type OperationDefinitionNode } from 'graphql';
import { createMutationProcessor, mutationDependecies } from './mutation.js';
import { createQueryProcessor, queryDependecies } from './query.js';
import { uniqueArray } from './utils.js';

// Exported as a named `plugin` (not only via the default object) so GraphQL Code
// Generator can resolve the plugin function whether the module is loaded with ESM
// `import` or CJS `require`. codegen 7 loads custom plugins via `import`, which only
// sees named/default exports of this `"type": "module"` package; a default-only
// export fails with `does not export a valid JS object with "plugin" function`.
// Since this plugin is designed to work only with near-operation-file, there will
// always only be 1 document file at a time.
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

  const haveQueries = queryContents.length > 0;
  const haveMutations = mutationContents.length > 0;

  return {
    prepend: uniqueArray([
      ...(haveQueries ? queryDependecies : []),

      ...(haveMutations ? mutationDependecies : []),
    ]),
    content: queryContents.join('\n') + mutationContents.join('\n'),
  };
};

const codegenPlugin: CodegenPlugin = { plugin };

export default codegenPlugin;
