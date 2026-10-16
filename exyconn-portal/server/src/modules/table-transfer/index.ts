import type { GraphQLResolveInfo } from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { exportTable, type ExportArgs } from './tableExport';
import { parseTableFile } from './tableFiles';
import { importRows, type ImportArgs } from './tableImport';
import { tableInfo } from './tableInfo';
import { importTemplate, type TemplateArgs } from './tableTemplate';

/**
 * Export, import and the import template for every paged grid. None of it is per module: each
 * operation runs the list's own query and the module's own mutations through the schema.
 */
export const tableTransferResolvers = {
  Query: {
    tableExport: (_p: unknown, args: ExportArgs, ctx: GraphQLContext, info: GraphQLResolveInfo) =>
      exportTable(info.schema, ctx, args),
    tableInfo: (
      _p: unknown,
      { list }: { list: string },
      ctx: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      assertAuthenticated(ctx);
      return tableInfo(info.schema, list);
    },
    tableImportTemplate: (
      _p: unknown,
      args: TemplateArgs,
      ctx: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => importTemplate(info.schema, ctx, args),
  },
  Mutation: {
    parseTableFile: (
      _p: unknown,
      { fileName, contentBase64 }: { fileName: string; contentBase64: string },
      ctx: GraphQLContext,
    ) => {
      assertAuthenticated(ctx);
      return parseTableFile(fileName, Buffer.from(contentBase64, 'base64'));
    },
    importTableRows: (
      _p: unknown,
      args: ImportArgs,
      ctx: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      assertAuthenticated(ctx);
      return importRows(info.schema, ctx, args);
    },
  },
};

export { tableTransferTypeDefs } from './tableTransfer.typeDefs';
export { registerTable } from './registry';
