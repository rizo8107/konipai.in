/**
 * PocketBase TypeScript Declarations for custom hooks
 */

declare const routerAdd: (method: string, path: string, handler: (c: any) => any) => void;
declare const onBootstrap: (callback: Function) => void;

declare namespace $apis {
    function requestInfo(c: any): {
        data: any;
        authRecord: any;
    };
}

declare namespace $app {
    function dao(): {
        db(): {
            newQuery(sql: string): {
                execute(...args: any[]): any;
            };
        };
        findRecordById(collection: string, id: string): any;
        saveRecord(record: any): any;
    };
}

declare namespace $os {
    function getenv(name: string): string | undefined;
}

declare namespace $http {
    function send(options: {
        url: string;
        method: string;
        body?: string;
        headers?: Record<string, string>;
    }): {
        statusCode: number;
        raw: string;
    };
} 