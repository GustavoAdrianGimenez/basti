import {
  AwsAccessDeniedError,
  AwsDependencyViolationError,
} from '../../aws/common/aws-error.js';
import { AwsTimeoutError } from '../../aws/common/waiter-error.js';
import { getErrorMessage } from '../../common/get-error-message.js';
import {
  ManagedResourceType,
  ResourceType,
  TargetType,
} from '../../common/resource-type.js';
import {
  ResourceDamagedError,
  ResourceNotFoundError,
  RuntimeError,
  UnexpectedStateError,
} from '../../common/runtime-error.js';

type Constructor<T> = new (...args: any) => T;

export interface ErrorMessageProvider<T extends Error = any> {
  error: Constructor<T>;
  detail: (error: T) => string;
}

export function detailProvider<T extends Error>(
  error: Constructor<T>,
  detail: (error: T) => string
): ErrorMessageProvider<T> {
  return { error, detail };
}

const RESOURCE_TYPE_NAME: Record<ResourceType, string> = {
  [ManagedResourceType.BASTION_INSTANCE]: 'Bastion instance',
  [ManagedResourceType.BASTION_SECURITY_GROUP]: 'Bastion security group',
  [ManagedResourceType.BASTION_ROLE]: 'Bastion role',
  [ManagedResourceType.ACCESS_SECURITY_GROUP]: 'Access security group',
  [ManagedResourceType.BASTION_INSTANCE_PROFILE]: 'Bastion instance profile',
  [TargetType.RDS_INSTANCE]: 'RDS instance',
  [TargetType.RDS_CLUSTER]: 'RDS cluster',
  [TargetType.CUSTOM]: 'Custom target',
};

export const COMMON_DETAIL_PROVIDERS: ErrorMessageProvider[] = [
  detailProvider(AwsAccessDeniedError, error => 'Access denied by IAM'),
  detailProvider(
    AwsTimeoutError,
    () => 'Operation timed out. This looks like an AWS delay. Please try again'
  ),
  detailProvider(
    AwsDependencyViolationError,
    () => 'Resource has other resources dependent on it'
  ),
  detailProvider(
    UnexpectedStateError,
    () =>
      'Unexpected Basti setup state. Looks like some of the Basti-managed resources were changed outside of Basti. Please try again after cleaning up the Basti setup'
  ),
  detailProvider(
    ResourceNotFoundError,
    error =>
      `${RESOURCE_TYPE_NAME[error.resourceType]} ${
        error.resourceId ? `"${error.resourceId}"` : ''
      } was not found`
  ),
  detailProvider(
    ResourceDamagedError,
    error =>
      `${error.resourceType} "${error.resourceId}" is in unexpected state: ${error.detail}`
  ),
];

export function getErrorDetail(
  error: unknown,
  detailProviders?: ErrorMessageProvider[]
): string {
  const allProviders = [...(detailProviders || []), ...COMMON_DETAIL_PROVIDERS];

  const detail = allProviders
    .find(provider => isMatchingProvider(provider, error))
    ?.detail(error);

  if (!detail) {
    return `Unexpected error: ${getErrorMessage(error)}`;
  }

  const cause = error instanceof RuntimeError ? error.cause : undefined;

  return cause
    ? `${detail}. ${getErrorDetail(cause, detailProviders)}`
    : detail;
}

function isMatchingProvider<T extends Error>(
  provider: ErrorMessageProvider<T>,
  error: unknown
): error is T {
  return error instanceof provider.error;
}
