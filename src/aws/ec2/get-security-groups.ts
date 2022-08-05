import { DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { getTagFilter } from "../tags/get-tag-filter.js";
import { AwsTag } from "../tags/types.js";
import { ec2Client } from "./ec2-client.js";
import { parseSecurityGroupResponse } from "./parse-ec2-response.js";
import { AwsSecurityGroup } from "./types/aws-security-group.js";

export interface GetSecurityGroupsInput {
  securityGroupIds?: string[];
  tags?: AwsTag[];
}

export async function getSecurityGroups({
  securityGroupIds,
  tags,
}: GetSecurityGroupsInput): Promise<AwsSecurityGroup[]> {
  const { SecurityGroups } = await ec2Client.send(
    new DescribeSecurityGroupsCommand({
      GroupIds: securityGroupIds,
      Filters: [...(tags ? tags.map(getTagFilter) : [])],
    })
  );

  if (!SecurityGroups) {
    throw new Error(`Invalid response from AWS.`);
  }

  return SecurityGroups.map(parseSecurityGroupResponse);
}
