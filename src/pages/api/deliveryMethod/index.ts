// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import deliveryMethods from '../../../mock/deliveryMethods.json';
import { DeliveryMethodstype } from '../../../types/DeliveryMethodsType';

const methods = deliveryMethods.map((method) => {
    return {
        id: method['id'],
        category: method['category'],
        deliveryOption: method['deliveryOption'],
        description: method['description'],
        price: method['price'],
    } as DeliveryMethodstype;
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return res.status(200).json({ data: methods });
    }
    // 405 means "Method Not Allowed"
    return res.status(405).end();
}
