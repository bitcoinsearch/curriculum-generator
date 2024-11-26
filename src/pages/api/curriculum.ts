// src/pages/api/myRoute.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { topics, getTopic, getTopics } from '@/lib/curriculumLogic';
import { client } from '@/config/elasticsearch';
import { generateCurriculum, getAITopic } from '@/lib/openai';

type ResponseData = {
    data: unknown;
    message: string;
};

const size = 50;
const from = 0;

const FIELDS_TO_SEARCH = ["title", "summary"];


let baseQuery = {
    query: {
        bool: {
            must: [{
                multi_match: {
                    query: '',
                    fields: FIELDS_TO_SEARCH,
                    fuzziness: 0,
                    minimum_should_match: "90%",
                },
            }],
            must_not: [
                {
                    term: {
                        "type.keyword": "combined-summary",
                    },
                },
            ],
        },
    },
    size, // Number of search results to return
    from, // Offset for pagination (calculated from page number)
    _source: {
        includes: ["title", "summary", "authors", "domain", "tags"],
    },
};


function buildQuery(title: string): typeof baseQuery {
    baseQuery.query.bool.must[0].multi_match.query = title;

    return baseQuery;
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
                const query = buildQuery(topic.title);

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
