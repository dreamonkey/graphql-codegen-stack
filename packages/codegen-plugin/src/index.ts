import { type CodegenPlugin } from '@graphql-codegen/plugin-helpers';
import { type OperationDefinitionNode } from 'graphql';
import { createMutationProcessor, mutationDependecies } from './mutation';
import { createQueryProcessor, queryDependecies } from './query';
import { uniqueArray } from './utils';

const codegenPlugin: CodegenPlugin = {
  // Since this plugin is designed to work only with near-operation-file, there will always only be 1 document file at a time
  // TODO: Support multiple documents
  plugin(schema, [documentFile]) {
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
        definition.kind === 'OperationDefinition',
    );

    const queryFields = queryType.getFields();
    const queryContents = operations
      .filter(({ operation }) => operation === 'query')
      .map(createQueryProcessor(queryFields))
      .filter((content): content is string => content !== undefined);

    const mutationContents = operations
      .filter(({ operation }) => operation === 'mutation')
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
  },
};

export default codegenPlugin;
