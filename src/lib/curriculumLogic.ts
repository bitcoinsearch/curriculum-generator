// src/lib/myRouteLogic.ts

interface Topic {
    title: string;
    slug: string;
    optech_url: string;
    categories: string[];
    aliases: string[];
    excerpt: string;
}

export let topics: Topic[] = [];

export async function getTopics(): Promise<Topic[]> {
    const url = process.env.BTICOIN_TOPICS_URL ?? '';

    const response = await fetch(url);
    const data = await response.json();

    topics = data;

    return data;
}

export function getTopic(title: string): Topic | undefined {
    return topics.find(topic => topic.title === title || topic.slug === title || topic.aliases?.includes(title));
}   
