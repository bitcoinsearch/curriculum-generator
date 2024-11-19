// src/lib/myRouteLogic.ts

export type MyData = {
    id: number;
    name: string;
};

export function fetchData(): MyData {
    return {
        id: 1,
        name: 'Hello from the business logic of the curriculum!',
    };
}

export function handlePostRequest(body: any): MyData {
    // Example processing logic for a POST request
    return {
        id: 2,
        name: `You sent: ${body.name}`,
    };
}
