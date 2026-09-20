import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { pool } from "../../config/database.js";

export abstract class BaseRepository<T extends QueryResultRow> {
  protected readonly pool = pool;

  protected async query<R extends QueryResultRow = T>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, params);
  }

  /**
   * Executes a series of database operations within an atomic transaction.
   * Commits if the callback completes, rolls back on any error, and releases the client.
   */
  public async withTransaction<R>(
    work: (client: PoolClient) => Promise<R>,
  ): Promise<R> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
