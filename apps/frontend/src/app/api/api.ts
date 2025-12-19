import { apiClient } from "./client";
import {
  ILoginInput,
  IRegisterInput,
  ILoginApiResponse,
  IRegisterApiResponse,
  IRefreshTokenApiResponse,
  IMeApiResponse,
  ILogoutApiResponse,
  IUserPublic,
  ISession,
  IUserStats,
  IDownloadFileApiResponse,
  IDeleteFileApiResponse,
  IUpdateFileApiResponse,
  IMoveFileInput,
  ICloneFileApiResponse,
  ICloneFileInput,
  ICloneFolderApiResponse,
  ICloneFolderInput,
  ICreateFolderApiResponse,
  ICreateFolderInput,
  IDeleteFolderApiResponse,
  IGetFileApiResponse,
  IGetFolderApiResponse,
  IGetFolderContentApiResponse,
  IGetUserLibraryApiResponse,
  IMoveFolderInput,
  ISearchLibraryApiResponse,
  IUpdateFileInput,
  IUpdateFolderApiResponse,
  IUpdateFolderInput,
  IUploadFileApiResponse,
  IUploadFileMetadata,
  IUsersWithAccessResponse,
  IFolderPermission,
  IFolderPermissionWithUser,
  IFilePermission,
  IFilePermissionWithUser,
  IPermissionCheckResult,
  ISharedUsersResponse,
  IBatchGrantResult,
  IUserPermissionSummary,
  IBulkPermissionResult,
  IGrantFolderPermissionInput,
  IUpdateFolderPermissionInput,
  IGrantFilePermissionInput,
  IUpdateFilePermissionInput,
  ISearchUsersApiResponse,
  ISearchUsersResponse,
  IGetUserSessionsApiResponse,
  IGetUserStatsApiResponse,
  IGetUsersWithAccessApiResponse,
  IGetUserApiResponse,
} from "@monorepo/shared";

export const api = {
  auth: {
    register: async (data: IRegisterInput) => {
      const response = await apiClient.post<IRegisterApiResponse>(
        "/api/auth/register",
        data
      );
      return response.data;
    },

    login: async (data: ILoginInput) => {
      const response = await apiClient.post<ILoginApiResponse>(
        "/api/auth/login",
        data
      );
      return response.data;
    },

    logout: async () => {
      const response = await apiClient.post<ILogoutApiResponse>(
        "/api/auth/logout"
      );
      return response.data;
    },

    refresh: async () => {
      const response = await apiClient.post<IRefreshTokenApiResponse>(
        "/api/auth/refresh"
      );
      return response.data;
    },

    getMe: async () => {
      const response = await apiClient.get<IMeApiResponse>("/api/auth/me");
      return response.data;
    },
  },

  users: {
    getUser: async (id: string) => {
      const response = await apiClient.get<IGetUserApiResponse>(
        `/api/users/${id}`
      );
      return response.data.data;
    },

    getUserSessions: async (id: string) => {
      const response = await apiClient.get<IGetUserSessionsApiResponse>(
        `/api/users/${id}/sessions`
      );
      return response.data.data;
    },

    getUserStats: async (id: string) => {
      const response = await apiClient.get<IGetUserStatsApiResponse>(
        `/api/users/${id}/stats`
      );
      return response.data.data;
    },

    deleteSession: async (userId: string, sessionId: string) => {
      await apiClient.delete(`/api/users/${userId}/sessions/${sessionId}`);
    },

    getUsersWithAccess: async (
      userId: string,
      params?: {
        page?: number;
        limit?: number;
      }
    ) => {
      const response = await apiClient.get<IGetUsersWithAccessApiResponse>(
        `/api/users/${userId}/shared-with`,
        { params }
      );
      return response.data.data;
    },

    searchUsers: async (params: {
      query: string;
      page?: number;
      limit?: number;
    }) => {
      const response = await apiClient.get<ISearchUsersApiResponse>(
        `/api/users/search`,
        { params }
      );

      return response.data.data;
    },
  },

  library: {
    getUserLibrary: async (params?: {
      foldersPage?: number;
      foldersLimit?: number;
      filesPage?: number;
      filesLimit?: number;
    }) => {
      console.log({
        params,
      });

      const response = await apiClient.get<IGetUserLibraryApiResponse>(
        "/api/library",
        { params }
      );
      return response.data;
    },

    search: async (params: {
      query: string;
      type?: "folder" | "file" | "all";
      folderId?: string;
      isPublic?: boolean;
      page?: number;
      limit?: number;
    }) => {
      const response = await apiClient.get<ISearchLibraryApiResponse>(
        "/api/library/search",
        { params }
      );
      return response.data;
    },

    folders: {
      create: async (data: ICreateFolderInput) => {
        const response = await apiClient.post<ICreateFolderApiResponse>(
          "/api/library/folders",
          data
        );
        return response.data;
      },

      getById: async (id: string) => {
        const response = await apiClient.get<IGetFolderApiResponse>(
          `/api/library/folders/${id}`
        );
        return response.data;
      },

      getContent: async (
        id: string,
        params?: {
          page?: number;
          limit?: number;
          sortBy?: "name" | "createdAt" | "order";
          sortOrder?: "asc" | "desc";
        }
      ) => {
        const response = await apiClient.get<IGetFolderContentApiResponse>(
          `/api/library/folders/${id}/content`,
          { params }
        );
        return response.data;
      },

      update: async (id: string, data: IUpdateFolderInput) => {
        const response = await apiClient.patch<IUpdateFolderApiResponse>(
          `/api/library/folders/${id}`,
          data
        );
        return response.data;
      },

      move: async (id: string, data: IMoveFolderInput) => {
        const response = await apiClient.patch<IUpdateFolderApiResponse>(
          `/api/library/folders/${id}/move`,
          data
        );
        return response.data;
      },

      clone: async (id: string, data: ICloneFolderInput) => {
        const response = await apiClient.post<ICloneFolderApiResponse>(
          `/api/library/folders/${id}/clone`,
          data
        );
        return response.data;
      },

      delete: async (id: string, cascade: boolean = true) => {
        const response = await apiClient.delete<IDeleteFolderApiResponse>(
          `/api/library/folders/${id}`,
          { params: { cascade } }
        );
        return response.data;
      },
    },

    files: {
      upload: async (file: File, metadata: IUploadFileMetadata) => {
        const formData = new FormData();

        formData.append("file", file);

        if (metadata.name) formData.append("name", metadata.name);
        if (metadata.description)
          formData.append("description", metadata.description);
        if (metadata.folderId) formData.append("folderId", metadata.folderId);
        if (metadata.isPublic !== undefined)
          formData.append("isPublic", String(metadata.isPublic));
        if (metadata.order !== undefined)
          formData.append("order", String(metadata.order));

        const response = await apiClient.post<IUploadFileApiResponse>(
          "/api/library/files/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      },

      getById: async (id: string) => {
        const response = await apiClient.get<IGetFileApiResponse>(
          `/api/library/files/${id}`
        );
        return response.data;
      },

      update: async (id: string, data: IUpdateFileInput) => {
        const response = await apiClient.patch<IUpdateFileApiResponse>(
          `/api/library/files/${id}`,
          data
        );
        return response.data;
      },

      move: async (id: string, data: IMoveFileInput) => {
        const response = await apiClient.patch<IUpdateFileApiResponse>(
          `/api/library/files/${id}/move`,
          data
        );
        return response.data;
      },

      clone: async (id: string, data: ICloneFileInput) => {
        const response = await apiClient.post<ICloneFileApiResponse>(
          `/api/library/files/${id}/clone`,
          data
        );
        return response.data;
      },

      delete: async (id: string) => {
        const response = await apiClient.delete<IDeleteFileApiResponse>(
          `/api/library/files/${id}`
        );
        return response.data;
      },

      getDownloadUrl: async (id: string) => {
        const response = await apiClient.get<IDownloadFileApiResponse>(
          `/api/library/files/${id}/download`
        );
        return response.data;
      },

      download: (id: string) => {
        // Direct download
        window.open(
          `${apiClient.defaults.baseURL}/api/library/files/${id}/download/direct`,
          "_blank"
        );
      },
    },

    public: {
      checkResource: async (publicUrl: string) => {
        const response = await apiClient.get(
          `/api/library/public/${publicUrl}/check`
        );
        return response.data;
      },

      getFolderContent: async (
        publicUrl: string,
        params?: {
          page?: number;
          limit?: number;
          sortBy?: "name" | "createdAt" | "order";
          sortOrder?: "asc" | "desc";
        }
      ) => {
        const response = await apiClient.get(
          `/api/library/public/${publicUrl}/folder`,
          { params }
        );
        return response.data;
      },

      getFile: async (publicUrl: string) => {
        const response = await apiClient.get(
          `/api/library/public/${publicUrl}/file`
        );
        return response.data;
      },

      downloadFile: (publicUrl: string) => {
        window.open(
          `${apiClient.defaults.baseURL}/api/library/public/${publicUrl}/download`,
          "_blank"
        );
      },

      getFileDownloadInfo: async (publicUrl: string) => {
        const response = await apiClient.get(
          `/api/library/public/${publicUrl}/download-info`
        );
        return response.data;
      },
    },
  },

  permissions: {
    folders: {
      grant: async (data: IGrantFolderPermissionInput) => {
        const response = await apiClient.post<IFolderPermission>(
          "/api/permissions/folders",
          data
        );
        return response.data;
      },

      batchGrant: async (data: {
        folderId: string;
        userIds: string[];
        role: "OWNER" | "EDITOR" | "VIEWER";
      }) => {
        const response = await apiClient.post<IBatchGrantResult>(
          "/api/permissions/folders/batch",
          data
        );
        return response.data;
      },

      batchGrantMultiple: async (data: {
        folderIds: string[];
        userIds: string[];
        role: "OWNER" | "EDITOR" | "VIEWER";
      }) => {
        const response = await apiClient.post<IBulkPermissionResult>(
          "/api/permissions/folders/batch-multiple",
          data
        );
        return response.data;
      },

      update: async (
        permissionId: string,
        data: IUpdateFolderPermissionInput
      ) => {
        const response = await apiClient.put<IFolderPermission>(
          `/api/permissions/folders/${permissionId}`,
          data
        );
        return response.data;
      },

      revoke: async (permissionId: string) => {
        await apiClient.delete(`/api/permissions/folders/${permissionId}`);
      },

      getAll: async (folderId: string) => {
        const response = await apiClient.get<IFolderPermission[]>(
          `/api/permissions/folders/${folderId}`
        );
        return response.data;
      },

      getAllWithUsers: async (folderId: string) => {
        const response = await apiClient.get<IFolderPermissionWithUser[]>(
          `/api/permissions/folders/${folderId}/with-users`
        );
        return response.data;
      },

      getSharedUsers: async (folderId: string) => {
        const response = await apiClient.get<ISharedUsersResponse>(
          `/api/permissions/folders/${folderId}/shared-users`
        );
        return response.data;
      },

      checkPermission: async (folderId: string, userId: string) => {
        const response = await apiClient.get<IPermissionCheckResult>(
          `/api/permissions/check/folders/${folderId}/users/${userId}`
        );
        return response.data;
      },
    },

    files: {
      grant: async (data: IGrantFilePermissionInput) => {
        const response = await apiClient.post<IFilePermission>(
          "/api/permissions/files",
          data
        );
        return response.data;
      },

      batchGrant: async (data: {
        fileId: string;
        userIds: string[];
        role: "OWNER" | "EDITOR" | "VIEWER";
      }) => {
        const response = await apiClient.post<IBatchGrantResult>(
          "/api/permissions/files/batch",
          data
        );
        return response.data;
      },

      batchGrantMultiple: async (data: {
        fileIds: string[];
        userIds: string[];
        role: "OWNER" | "EDITOR" | "VIEWER";
      }) => {
        const response = await apiClient.post<IBulkPermissionResult>(
          "/api/permissions/files/batch-multiple",
          data
        );
        return response.data;
      },

      update: async (
        permissionId: string,
        data: IUpdateFilePermissionInput
      ) => {
        const response = await apiClient.put<IFilePermission>(
          `/api/permissions/files/${permissionId}`,
          data
        );
        return response.data;
      },

      revoke: async (permissionId: string) => {
        await apiClient.delete(`/api/permissions/files/${permissionId}`);
      },

      getAll: async (fileId: string) => {
        const response = await apiClient.get<IFilePermission[]>(
          `/api/permissions/files/${fileId}`
        );
        return response.data;
      },

      getAllWithUsers: async (fileId: string) => {
        const response = await apiClient.get<IFilePermissionWithUser[]>(
          `/api/permissions/files/${fileId}/with-users`
        );
        return response.data;
      },

      getSharedUsers: async (fileId: string) => {
        const response = await apiClient.get<ISharedUsersResponse>(
          `/api/permissions/files/${fileId}/shared-users`
        );
        return response.data;
      },

      checkPermission: async (fileId: string, userId: string) => {
        const response = await apiClient.get<IPermissionCheckResult>(
          `/api/permissions/check/files/${fileId}/users/${userId}`
        );
        return response.data;
      },
    },

    getUserSummary: async (userId: string) => {
      const response = await apiClient.get<IUserPermissionSummary>(
        `/api/permissions/users/${userId}/summary`
      );
      return response.data;
    },
  },
};
