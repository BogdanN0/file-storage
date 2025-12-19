import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

import { api } from "./api";
import {
  ILoginInput,
  IRegisterInput,
  ICreateFolderInput,
  IUpdateFolderInput,
  IMoveFolderInput,
  ICloneFolderInput,
  IUploadFileMetadata,
  IUpdateFileInput,
  IMoveFileInput,
  ICloneFileInput,
} from "@monorepo/shared";

export const apiHooks = {
  auth: {
    useLogin: () => {
      const router = useRouter();
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: ILoginInput) => api.auth.login(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: authKeys.me });
          router.push("/library");
        },
        onError: (error: AxiosError<{ message: string }>) => {
          throw new Error(error.response?.data?.message || "Login failed");
        },
      });
    },

    useRegister: () => {
      const router = useRouter();
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: IRegisterInput) => api.auth.register(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: authKeys.me });
          router.push("/library");
        },
        onError: (error: AxiosError<{ message: string }>) => {
          throw new Error(
            error.response?.data?.message || "Registration failed"
          );
        },
      });
    },

    useLogout: () => {
      const router = useRouter();
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: () => api.auth.logout(),
        onSuccess: () => {
          queryClient.setQueryData(authKeys.me, null);
          queryClient.clear();
          router.push("/login");
        },
      });
    },

    useMe: () => {
      return useQuery({
        queryKey: authKeys.me,
        queryFn: () => api.auth.getMe(),
        retry: false,
        retryOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      });
    },
  },

  users: {
    useUserSessions: (userId: string | undefined) => {
      return useQuery({
        queryKey: userKeys.sessions(userId!),
        queryFn: () => api.users.getUserSessions(userId!),
        enabled: !!userId,
        staleTime: 1 * 60 * 1000,
      });
    },

    useUserStats: (userId: string | undefined) => {
      return useQuery({
        queryKey: userKeys.stats(userId!),
        queryFn: () => api.users.getUserStats(userId!),
        enabled: !!userId,
        staleTime: 1 * 60 * 1000,
      });
    },

    useDeleteSession: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({
          userId,
          sessionId,
        }: {
          userId: string;
          sessionId: string;
        }) => api.users.deleteSession(userId, sessionId),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: userKeys.sessions(variables.userId),
          });
          queryClient.invalidateQueries({
            queryKey: userKeys.stats(variables.userId),
          });
        },
      });
    },

    useUsersWithAccess: (
      userId: string | undefined,
      params?: {
        page?: number;
        limit?: number;
      }
    ) => {
      return useQuery({
        queryKey: [...userKeys.usersWithAccess(userId!), params],
        queryFn: () => api.users.getUsersWithAccess(userId!, params),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      });
    },

    useSearchUsers: (params: {
      query: string;
      page?: number;
      limit?: number;
    }) => {
      return useQuery({
        queryKey: [...userKeys.all, "search", params],
        queryFn: () => api.users.searchUsers(params),
        enabled: params.query.length > 0,
        staleTime: 1 * 60 * 1000,
      });
    },
  },

  library: {
    useUserLibrary: (params?: {
      foldersPage?: number;
      foldersLimit?: number;
      filesPage?: number;
      filesLimit?: number;
    }) => {
      return useQuery({
        queryKey: [...libraryKeys.library(), params],
        queryFn: () => api.library.getUserLibrary(params),
        staleTime: 2 * 60 * 1000,
      });
    },

    useLibrarySearch: (
      query: string,
      params?: {
        type?: "folder" | "file" | "all";
        folderId?: string;
        isPublic?: boolean;
        page?: number;
        limit?: number;
      }
    ) => {
      return useQuery({
        queryKey: [...libraryKeys.search(query), params],
        queryFn: () => api.library.search({ query, ...params }),
        enabled: query.length > 0,
        staleTime: 1 * 60 * 1000,
      });
    },

    useFolder: (id: string | undefined) => {
      return useQuery({
        queryKey: libraryKeys.folders.detail(id!),
        queryFn: () => api.library.folders.getById(id!),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
      });
    },

    useFolderContent: (
      id: string | undefined,
      params?: {
        page?: number;
        limit?: number;
        sortBy?: "name" | "createdAt" | "order";
        sortOrder?: "asc" | "desc";
      }
    ) => {
      return useQuery({
        queryKey: [...libraryKeys.folders.content(id!), params],
        queryFn: () => api.library.folders.getContent(id!, params),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
      });
    },

    useCreateFolder: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: ICreateFolderInput) =>
          api.library.folders.create(data),
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });
          queryClient.invalidateQueries({ queryKey: libraryKeys.folders.all });

          if (response.data.parentId) {
            queryClient.invalidateQueries({
              queryKey: libraryKeys.folders.content(response.data.parentId),
            });
          }
        },
        onError: (error: AxiosError<{ message: string }>) => {
          throw new Error(
            error.response?.data?.message || "Failed to create folder"
          );
        },
      });
    },

    useUpdateFolder: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({ id, data }: { id: string; data: IUpdateFolderInput }) =>
          api.library.folders.update(id, data),
        onSuccess: (response, variables) => {
          queryClient.invalidateQueries({
            queryKey: libraryKeys.folders.detail(variables.id),
          });
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });

          if (response.data.parentId) {
            queryClient.invalidateQueries({
              queryKey: libraryKeys.folders.content(response.data.parentId),
            });
          }
        },
      });
    },

    useMoveFolder: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({ id, data }: { id: string; data: IMoveFolderInput }) =>
          api.library.folders.move(id, data),
        onSuccess: (response, variables) => {
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });
          queryClient.invalidateQueries({ queryKey: libraryKeys.folders.all });

          // Invalidate new parent folder content
          if (variables.data.parentId) {
            queryClient.invalidateQueries({
              queryKey: libraryKeys.folders.content(variables.data.parentId),
            });
          }
        },
      });
    },

    useCloneFolder: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ICloneFolderInput }) =>
          api.library.folders.clone(id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });
          queryClient.invalidateQueries({ queryKey: libraryKeys.folders.all });
        },
      });
    },

    useDeleteFolder: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({ id, cascade }: { id: string; cascade?: boolean }) =>
          api.library.folders.delete(id, cascade),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });
          queryClient.invalidateQueries({ queryKey: libraryKeys.folders.all });
        },
      });
    },

    // FILES
    useFile: (id: string | undefined) => {
      return useQuery({
        queryKey: libraryKeys.files.detail(id!),
        queryFn: () => api.library.files.getById(id!),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
      });
    },

    useUploadFile: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({
          file,
          metadata,
        }: {
          file: File;
          metadata: IUploadFileMetadata;
        }) => api.library.files.upload(file, metadata),
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });
          queryClient.invalidateQueries({ queryKey: libraryKeys.files.all });

          if (response.data.file.folderId) {
            queryClient.invalidateQueries({
              queryKey: libraryKeys.folders.content(
                response.data.file.folderId
              ),
            });
          }
        },
        onError: (error: AxiosError<{ message: string }>) => {
          console.log({ error });

          throw new Error(
            error.response?.data?.message || "Failed to upload file"
          );
        },
      });
    },

    useUpdateFile: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({ id, data }: { id: string; data: IUpdateFileInput }) =>
          api.library.files.update(id, data),
        onSuccess: (response, variables) => {
          queryClient.invalidateQueries({
            queryKey: libraryKeys.files.detail(variables.id),
          });
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });

          if (response.data.folderId) {
            queryClient.invalidateQueries({
              queryKey: libraryKeys.folders.content(response.data.folderId),
            });
          }
        },
      });
    },

    useMoveFile: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({ id, data }: { id: string; data: IMoveFileInput }) =>
          api.library.files.move(id, data),
        onSuccess: (response, variables) => {
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });
          queryClient.invalidateQueries({ queryKey: libraryKeys.files.all });

          // Invalidate new parent folder content
          if (variables.data.folderId) {
            queryClient.invalidateQueries({
              queryKey: libraryKeys.folders.content(variables.data.folderId),
            });
          }
        },
      });
    },

    useCloneFile: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ICloneFileInput }) =>
          api.library.files.clone(id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });
          queryClient.invalidateQueries({ queryKey: libraryKeys.files.all });
        },
      });
    },

    useDeleteFile: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (id: string) => api.library.files.delete(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: libraryKeys.library() });
          queryClient.invalidateQueries({ queryKey: libraryKeys.files.all });
        },
      });
    },

    useDownloadFile: () => {
      return useMutation({
        mutationFn: (id: string) => api.library.files.getDownloadUrl(id),
        onSuccess: (response) => {
          api.library.files.download(response.data.url.split("/").pop()!);
        },
      });
    },

    usePublicResourceCheck: (publicUrl: string | undefined) => {
      return useQuery({
        queryKey: ["public", "check", publicUrl],
        queryFn: () => api.library.public.checkResource(publicUrl!),
        enabled: !!publicUrl,
        retry: false,
        staleTime: 5 * 60 * 1000,
      });
    },

    usePublicFolderContent: (
      publicUrl: string | undefined,
      params?: {
        page?: number;
        limit?: number;
        sortBy?: "name" | "createdAt" | "order";
        sortOrder?: "asc" | "desc";
      }
    ) => {
      return useQuery({
        queryKey: ["public", "folder", publicUrl, params],
        queryFn: () => api.library.public.getFolderContent(publicUrl!, params),
        enabled: !!publicUrl,
        retry: false,
        staleTime: 1 * 60 * 1000,
      });
    },

    usePublicFile: (publicUrl: string | undefined) => {
      return useQuery({
        queryKey: ["public", "file", publicUrl],
        queryFn: () => api.library.public.getFile(publicUrl!),
        enabled: !!publicUrl,
        retry: false,
        staleTime: 5 * 60 * 1000,
      });
    },

    usePublicFileDownloadInfo: (publicUrl: string | undefined) => {
      return useQuery({
        queryKey: ["public", "file", "download", publicUrl],
        queryFn: () => api.library.public.getFileDownloadInfo(publicUrl!),
        enabled: !!publicUrl,
        retry: false,
        staleTime: 1 * 60 * 1000,
      });
    },
  },

  permissions: {
    useFolderPermissions: (folderId: string | undefined) => {
      return useQuery({
        queryKey: permissionKeys.folders.permissions(folderId!),
        queryFn: () => api.permissions.folders.getAll(folderId!),
        enabled: !!folderId,
        staleTime: 2 * 60 * 1000,
      });
    },

    useFolderPermissionsWithUsers: (folderId: string | undefined) => {
      return useQuery({
        queryKey: permissionKeys.folders.permissionsWithUsers(folderId!),
        queryFn: () => api.permissions.folders.getAllWithUsers(folderId!),
        enabled: !!folderId,
        staleTime: 2 * 60 * 1000,
      });
    },

    useFolderSharedUsers: (folderId: string | undefined) => {
      return useQuery({
        queryKey: permissionKeys.folders.sharedUsers(folderId!),
        queryFn: () => api.permissions.folders.getSharedUsers(folderId!),
        enabled: !!folderId,
        staleTime: 2 * 60 * 1000,
      });
    },

    useFolderPermissionCheck: (
      folderId: string | undefined,
      userId: string | undefined
    ) => {
      return useQuery({
        queryKey: permissionKeys.folders.check(folderId!, userId!),
        queryFn: () =>
          api.permissions.folders.checkPermission(folderId!, userId!),
        enabled: !!folderId && !!userId,
        staleTime: 1 * 60 * 1000,
      });
    },

    useGrantFolderPermission: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: {
          folderId: string;
          userId: string;
          role: "OWNER" | "EDITOR" | "VIEWER";
        }) => api.permissions.folders.grant(data),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: permissionKeys.folders.permissions(variables.folderId),
          });
          queryClient.invalidateQueries({
            queryKey: permissionKeys.folders.permissionsWithUsers(
              variables.folderId
            ),
          });
          queryClient.invalidateQueries({
            queryKey: permissionKeys.folders.sharedUsers(variables.folderId),
          });
        },
        onError: (error: AxiosError<{ message: string }>) => {
          throw new Error(
            error.response?.data?.message || "Failed to grant permission"
          );
        },
      });
    },

    useBatchGrantFolderPermissions: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: {
          folderId: string;
          userIds: string[];
          role: "OWNER" | "EDITOR" | "VIEWER";
        }) => api.permissions.folders.batchGrant(data),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: permissionKeys.folders.permissions(variables.folderId),
          });
          queryClient.invalidateQueries({
            queryKey: permissionKeys.folders.permissionsWithUsers(
              variables.folderId
            ),
          });
          queryClient.invalidateQueries({
            queryKey: permissionKeys.folders.sharedUsers(variables.folderId),
          });
        },
        onError: (error: AxiosError<{ message: string }>) => {
          throw new Error(
            error.response?.data?.message || "Failed to batch grant permissions"
          );
        },
      });
    },

    useBatchGrantMultipleFolders: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: {
          folderIds: string[];
          userIds: string[];
          role: "OWNER" | "EDITOR" | "VIEWER";
        }) => api.permissions.folders.batchGrantMultiple(data),
        onSuccess: (_, variables) => {
          variables.folderIds.forEach((folderId) => {
            queryClient.invalidateQueries({
              queryKey: permissionKeys.folders.permissions(folderId),
            });
            queryClient.invalidateQueries({
              queryKey: permissionKeys.folders.permissionsWithUsers(folderId),
            });
            queryClient.invalidateQueries({
              queryKey: permissionKeys.folders.sharedUsers(folderId),
            });
          });
        },
      });
    },

    useUpdateFolderPermission: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({
          permissionId,
          data,
        }: {
          permissionId: string;
          data: { role: "OWNER" | "EDITOR" | "VIEWER" };
        }) => api.permissions.folders.update(permissionId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: permissionKeys.folders.all,
          });
        },
      });
    },

    useRevokeFolderPermission: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (permissionId: string) =>
          api.permissions.folders.revoke(permissionId),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: permissionKeys.folders.all,
          });
        },
      });
    },

    useFilePermissions: (fileId: string | undefined) => {
      return useQuery({
        queryKey: permissionKeys.files.permissions(fileId!),
        queryFn: () => api.permissions.files.getAll(fileId!),
        enabled: !!fileId,
        staleTime: 2 * 60 * 1000,
      });
    },

    useFilePermissionsWithUsers: (fileId: string | undefined) => {
      return useQuery({
        queryKey: permissionKeys.files.permissionsWithUsers(fileId!),
        queryFn: () => api.permissions.files.getAllWithUsers(fileId!),
        enabled: !!fileId,
        staleTime: 2 * 60 * 1000,
      });
    },

    useFileSharedUsers: (fileId: string | undefined) => {
      return useQuery({
        queryKey: permissionKeys.files.sharedUsers(fileId!),
        queryFn: () => api.permissions.files.getSharedUsers(fileId!),
        enabled: !!fileId,
        staleTime: 2 * 60 * 1000,
      });
    },

    useFilePermissionCheck: (
      fileId: string | undefined,
      userId: string | undefined
    ) => {
      return useQuery({
        queryKey: permissionKeys.files.check(fileId!, userId!),
        queryFn: () => api.permissions.files.checkPermission(fileId!, userId!),
        enabled: !!fileId && !!userId,
        staleTime: 1 * 60 * 1000,
      });
    },

    useGrantFilePermission: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: {
          fileId: string;
          userId: string;
          role: "OWNER" | "EDITOR" | "VIEWER";
        }) => api.permissions.files.grant(data),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: permissionKeys.files.permissions(variables.fileId),
          });
          queryClient.invalidateQueries({
            queryKey: permissionKeys.files.permissionsWithUsers(
              variables.fileId
            ),
          });
          queryClient.invalidateQueries({
            queryKey: permissionKeys.files.sharedUsers(variables.fileId),
          });
        },
        onError: (error: AxiosError<{ message: string }>) => {
          throw new Error(
            error.response?.data?.message || "Failed to grant permission"
          );
        },
      });
    },

    useBatchGrantFilePermissions: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: {
          fileId: string;
          userIds: string[];
          role: "OWNER" | "EDITOR" | "VIEWER";
        }) => api.permissions.files.batchGrant(data),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({
            queryKey: permissionKeys.files.permissions(variables.fileId),
          });
          queryClient.invalidateQueries({
            queryKey: permissionKeys.files.permissionsWithUsers(
              variables.fileId
            ),
          });
          queryClient.invalidateQueries({
            queryKey: permissionKeys.files.sharedUsers(variables.fileId),
          });
        },
        onError: (error: AxiosError<{ message: string }>) => {
          throw new Error(
            error.response?.data?.message || "Failed to batch grant permissions"
          );
        },
      });
    },

    useBatchGrantMultipleFiles: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (data: {
          fileIds: string[];
          userIds: string[];
          role: "OWNER" | "EDITOR" | "VIEWER";
        }) => api.permissions.files.batchGrantMultiple(data),
        onSuccess: (_, variables) => {
          variables.fileIds.forEach((fileId) => {
            queryClient.invalidateQueries({
              queryKey: permissionKeys.files.permissions(fileId),
            });
            queryClient.invalidateQueries({
              queryKey: permissionKeys.files.permissionsWithUsers(fileId),
            });
            queryClient.invalidateQueries({
              queryKey: permissionKeys.files.sharedUsers(fileId),
            });
          });
        },
      });
    },

    useUpdateFilePermission: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: ({
          permissionId,
          data,
        }: {
          permissionId: string;
          data: { role: "OWNER" | "EDITOR" | "VIEWER" };
        }) => api.permissions.files.update(permissionId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: permissionKeys.files.all,
          });
        },
      });
    },

    useRevokeFilePermission: () => {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: (permissionId: string) =>
          api.permissions.files.revoke(permissionId),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: permissionKeys.files.all,
          });
        },
      });
    },

    useUserPermissionSummary: (userId: string | undefined) => {
      return useQuery({
        queryKey: permissionKeys.userSummary(userId!),
        queryFn: () => api.permissions.getUserSummary(userId!),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000,
      });
    },
  },
};

export const authKeys = {
  me: ["auth", "me"] as const,
  all: ["auth"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  sessions: (userId: string) => [...userKeys.all, userId, "sessions"] as const,
  stats: (userId: string) => [...userKeys.all, userId, "stats"] as const,
  usersWithAccess: (userId: string) =>
    [...userKeys.all, userId, "shared-with"] as const,
};

const LIBRARY_KEY = ["library"] as const;

export const libraryKeys = {
  all: LIBRARY_KEY,

  library: () => [...LIBRARY_KEY, "user-library"] as const,

  search: (query: string) => [...LIBRARY_KEY, "search", query] as const,

  folders: {
    all: [...LIBRARY_KEY, "folders"] as const,

    detail: (id: string) => [...LIBRARY_KEY, "folders", id] as const,

    content: (id: string) =>
      [...LIBRARY_KEY, "folders", id, "content"] as const,
  },

  files: {
    all: [...LIBRARY_KEY, "files"] as const,

    detail: (id: string) => [...LIBRARY_KEY, "files", id] as const,
  },
} as const;

const PERMISSIONS_KEY = ["permissions"] as const;

export const permissionKeys = {
  all: PERMISSIONS_KEY,

  folders: {
    all: [...PERMISSIONS_KEY, "folders"] as const,

    permissions: (folderId: string) =>
      [...PERMISSIONS_KEY, "folders", folderId, "permissions"] as const,

    permissionsWithUsers: (folderId: string) =>
      [...PERMISSIONS_KEY, "folders", folderId, "with-users"] as const,

    sharedUsers: (folderId: string) =>
      [...PERMISSIONS_KEY, "folders", folderId, "shared-users"] as const,

    check: (folderId: string, userId: string) =>
      [...PERMISSIONS_KEY, "folders", folderId, "check", userId] as const,
  },

  files: {
    all: [...PERMISSIONS_KEY, "files"] as const,

    permissions: (fileId: string) =>
      [...PERMISSIONS_KEY, "files", fileId, "permissions"] as const,

    permissionsWithUsers: (fileId: string) =>
      [...PERMISSIONS_KEY, "files", fileId, "with-users"] as const,

    sharedUsers: (fileId: string) =>
      [...PERMISSIONS_KEY, "files", fileId, "shared-users"] as const,

    check: (fileId: string, userId: string) =>
      [...PERMISSIONS_KEY, "files", fileId, "check", userId] as const,
  },

  userSummary: (userId: string) =>
    [...PERMISSIONS_KEY, "users", userId, "summary"] as const,
} as const;
