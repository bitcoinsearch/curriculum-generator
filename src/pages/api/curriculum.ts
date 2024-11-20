// src/pages/api/myRoute.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchData, handlePostRequest } from '@/lib/curriculumLogic';

type ResponseData = {
    data: unknown;
    message: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    switch (req.method) {
        case 'GET': {
            const data = fetchData();
            res.status(200).json({ message: 'Success', data });
            break;
        }
        case 'POST': {
            const data = handlePostRequest(req.body);
            res.status(200).json({ message: 'Post Successful', data });
            break;
        }
    }
}
