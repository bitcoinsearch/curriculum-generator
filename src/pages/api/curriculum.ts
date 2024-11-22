// src/pages/api/myRoute.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { handlePostRequest } from '@/lib/curriculumLogic';
import { client } from '@/config/elasticsearch';

type ResponseData = {
    data: unknown;
    message: string;
};

const size = 10;
const from = 0;

const FIELDS_TO_SEARCH = ["title", "summary"];


let baseQuery = {
    query: {
        bool: {
            must: [{
                multi_match: {
                    query: 'Segwit',
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    switch (req.method) {
        case 'GET': {
            try {
                // Call the search method
                const result = await client.search({
                    index: process.env.INDEX,
                    ...baseQuery,
                });

                return res.status(200).json({
                    message: 'Success',
                    data: {
                        result: result.hits.hits,
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
            const data = handlePostRequest(req.body);
            res.status(200).json({ message: 'Post Successful', data });
            break;
        }
    }
}
