import { cleanAndValidateVersion } from '../utils/general-utils';
import { logger } from '../utils/logger';

export class GitHubService {
  private _repo: string;
  private _latestVersionCallback: ((version: string | null) => void) | null;
  private _isAvailable = false;
  private _fetchInProgress = false;

  public constructor(repo: string, latestVersionCallback: (version: string | null) => void) {
    this._repo = repo;
    this._latestVersionCallback = latestVersionCallback;
    void this._fetchLatestReleaseTag();
  }

  private async _fetchLatestReleaseTag(): Promise<void> {
    if (this._fetchInProgress) return;
    this._fetchInProgress = true;

    try {
      const url = `https://api.github.com/repos/${this._repo}/releases/latest`;

      const response = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' }
      });

      if (!response.ok) {
        logger.warn(`GitHub API returned ${response.status} for ${url}`);

        return;
      }

      const data = await response.json() as { tag_name?: unknown };

      if (typeof data.tag_name !== 'string') {
        logger.warn('GitHub API response missing tag_name');

        return;
      }

      const latestVersion = cleanAndValidateVersion(data.tag_name);

      if (this._latestVersionCallback === null) throw new Error('this._latestVersionCallback is null');

      this._latestVersionCallback(latestVersion);

      this._isAvailable = true;
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.warn(`GitHubService._fetchLatestReleaseTag failed: ${message}`);
    }
    finally {
      this._fetchInProgress = false;
    }
  }

  public disconnect(): void {
    this._latestVersionCallback = null;
    this._isAvailable = false;
  }
}