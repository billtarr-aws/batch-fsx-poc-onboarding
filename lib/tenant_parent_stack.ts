import cdk = require('@aws-cdk/core');
import BatchTenantStack from '../lib/tenant_batch';
import StepTenantStack from "../lib/tenant_step";

interface TenantParentStackProps extends cdk.StackProps {
  tenant: string;
}

class TenantParentStack extends cdk.Stack {
  public readonly stateMachineArn: string;

  constructor(scope: cdk.Construct, id: string, props: TenantParentStackProps) {
    super(scope, id, props);

    const batch = new BatchTenantStack(this, 'BatchTenantStack', {tenant: props.tenant})
    
    const step = new StepTenantStack(this, 'StepTenantStack', {tenant: props.tenant, batch: batch})

    new cdk.CfnOutput(this, 'stateMachineArn', {
      value: step.stateMachineArn
    });

  }
}

export default TenantParentStack;