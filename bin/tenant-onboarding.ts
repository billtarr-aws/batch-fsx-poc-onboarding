#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import TenantParentStack from "../lib/tenant_parent_stack";

const app = new cdk.App();

const tenant = app.node.tryGetContext('tenant')

new TenantParentStack(app, 'tenantStack-' + tenant, {
    tenant: tenant
});
