import {NextApiRequest, NextApiResponse} from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query
  const metaData = await axios.get(url as string)
  res.status(200).json(metaData.data);
}
