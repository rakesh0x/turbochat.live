declare module "next-auth/react" {
  export function useSession(): any;
  export function signOut(options?: any): Promise<any>;
}
