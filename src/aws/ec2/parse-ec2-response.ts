import { Instance, RouteTable, Subnet, Vpc } from "@aws-sdk/client-ec2";
import { z } from "zod";
import { AwsTagParser, transformTags } from "../parse-aws-response.js";
import { AwsEc2Instance, AwsRouteTable, AwsSubnet, AwsVpc } from "./types.js";

export const parseEc2InstanceResponse: (response: Instance) => AwsEc2Instance =
  z
    .object({
      InstanceId: z.string(),
    })
    .transform((response) => ({ id: response.InstanceId })).parse;

export const parseVpcResponse: (response: Vpc) => AwsVpc = z
  .object({
    VpcId: z.string(),
    Tags: z.array(AwsTagParser).optional(),
  })
  .transform((response) => {
    const tags = transformTags(response.Tags);
    return { id: response.VpcId, tags, name: tags["Name"] };
  }).parse;

export const parseSubnetResponse: (response: Subnet) => AwsSubnet = z
  .object({
    SubnetId: z.string(),
    Tags: z.array(AwsTagParser).optional(),
  })
  .transform((response) => {
    const tags = transformTags(response.Tags);
    return { id: response.SubnetId, tags, name: tags["Name"] };
  }).parse;

export const parseRouteTableResponse: (response: RouteTable) => AwsRouteTable =
  z
    .object({
      RouteTableId: z.string(),
    })
    .transform((response) => ({ id: response.RouteTableId })).parse;
