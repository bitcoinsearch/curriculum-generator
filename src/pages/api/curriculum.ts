// src/pages/api/myRoute.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { topics, getTopic, getTopics } from '@/lib/curriculumLogic';
import { client } from '@/config/elasticsearch';
import { generateCurriculum, getAITopic } from '@/lib/openai';

type ResponseData = {
    data: unknown;
    message: string;
};

const size = 100;
const from = 0;

const FIELDS_TO_SEARCH = ["title", "summary", "body"];


let baseQuery: any = {
    query: {
        bool: {
            must: [
                {
                    multi_match: {
                    },
                },
                {
                    bool: {
                    },
                }
            ],
            must_not: [
                {
                    term: {
                        "type.keyword": "combined-summary",
                    },
                },
                {
                    "match": {
                        "type": "answer"
                    }
                },
                {
                    "match": {
                        "type": "reply"
                    }
                },
            ],
        },
    },
    size, // Number of search results to return
    from, // Offset for pagination (calculated from page number)
    _source: {
        includes: ["title", "summary", "authors", "domain", "tags", "url"],
    },
};


function buildQuery(title: string, aliases: string[], topicCategory: string): typeof baseQuery {
    // create a should multi_match for each alias, using the FIELDS_TO_SEARCH
    const shouldMatch = aliases.map((alias) => ({
        multi_match: {
            fields: FIELDS_TO_SEARCH,
            query: alias,
            fuzziness: 0,
            minimum_should_match: "100%"
        }
    }));

    if (topicCategory === "lightning") {
        const mustNot = [
            {
                "match": {
                    "title": "Bitcoin"
                }
            },
            {
                "match": {
                    "body": "Bitcoin"
                }
            },
            {
                "match": {
                    "summary": "Bitcoin"
                }
            },
        ]

        baseQuery.query.bool.must_not.push(...mustNot);

    } else if (topicCategory === "bitcoin") {
        const mustNot = [
            {
                "match": {
                    "title": "Lightning"
                }
            },
            {
                "match": {
                    "body": "Lightning"
                }
            },
            {
                "match": {
                    "summary": "Lightning"
                }
            },
        ]

        baseQuery.query.bool.must_not.push(...mustNot);
    }

    return {
        ...baseQuery,
        query: {
            ...baseQuery.query,
            bool: {
                ...baseQuery.query.bool,
                must: [
                    {
                        multi_match: {
                            query: title,
                            fields: FIELDS_TO_SEARCH,
                            fuzziness: 0,
                            minimum_should_match: "100%"
                        }
                    },
                    {
                        bool: {
                            should: shouldMatch
                        }
                    },
                    ...baseQuery.query.bool.must.slice(1)
                ]
            }
        }
    };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    switch (req.method) {
        case 'GET': {
            try {

                if (topics.length === 0) {
                    // if the topics are not loaded, load them
                    await getTopics();
                }

                // get the topic title from the query
                const topicTitle = req.query.topic as string;

                let topicCategory = req.query.category as string;

                topicCategory = topicCategory.toLocaleLowerCase()


                const aiTopic = await getAITopic(topicTitle);

                // get the topic from the topics array
                const topic = getTopic(aiTopic?.topic ?? topicTitle);

                if (!topic) {
                    // if the topic is not found, return a 404 error
                    return res.status(404).json({
                        message: 'Topic not found',
                        data: null,
                    });
                }

                // build the query
                const query = buildQuery(topic.title, topic.aliases ?? aiTopic?.aliases ?? [], topicCategory);

                // Call the search method
                const result = await client.search({
                    index: process.env.INDEX,
                    ...query,
                });

                const resultData = result.hits.hits;

                // return only the sources property
                const sources = resultData.map((item: any) => item._source);

                // select only the sources that has a summary property          
                const sourcesWithSummary = sources.filter((item: any) => item.summary);

                const sourcesLength = sourcesWithSummary.length;

                // get only title and summary
                const sourcesWithTitleAndSummary = sourcesWithSummary.map((item: any) => ({
                    title: item.title,
                    summary: item.summary,
                    url: item.url
                }));

                // divide the sources into 2 different arrays using the sourcesLength
                const sourcesWithTitleAndSummaryArray1 = sourcesWithTitleAndSummary.slice(0, Math.floor(sourcesLength / 2));
                const sourcesWithTitleAndSummaryArray2 = sourcesWithTitleAndSummary.slice(Math.floor(sourcesLength / 2), sourcesLength);

                const completion1 = await generateCurriculum(sourcesWithTitleAndSummaryArray1);
                const completion2 = await generateCurriculum(sourcesWithTitleAndSummaryArray2);

                let combinedCompletion: any[] = [];

                if (completion1) {
                    // combine the 2 completions    
                    combinedCompletion = [...combinedCompletion, ...completion1]
                }

                if (completion2) {
                    // add the completion2 to the combinedCompletion
                    combinedCompletion = [...combinedCompletion, ...completion2];
                }


                // add the urls to the combinedCompletion
                combinedCompletion = combinedCompletion.map((item: any) => ({
                    ...item,
                    url: sourcesWithSummary.find((source: any) => source.title === item.title)?.url,
                }));

                return res.status(200).json({
                    message: 'Success',
                    data: {
                        result: combinedCompletion,
                    },
                });
            } catch (error: any) {
                console.error(error);
                return res.status(400).json({
                    message: error.errmsg || error.errors || error.message,
                    data: null,
                });
            }
        }
        case 'POST': {

            res.status(200).json({ message: 'Post Successful', data: {} });
            break;
        }
    }
}
