import { Stack, CfnTag } from 'aws-cdk-lib';
import { CfnSecurityGroup, CfnSecurityGroupEgress, CfnSecurityGroupEgressProps, CfnSecurityGroupIngress, CfnSecurityGroupIngressProps, CfnVPC} from 'aws-cdk-lib/aws-ec2';
import * as xlsx from 'xlsx';

export class SecurityGroup  {

    private sg: CfnSecurityGroup;
    private securityGroupName:string;
    private resource: ResourceInfo;

    constructor(securityGroupName:string) {
        this.securityGroupName = securityGroupName;
        this.createSecurityInfo();
    };

    createResources(scope: Stack) {
        this.sg = this.createSecurityGroup(scope, this.resource);
        this.createSecurityGroupIngress(scope, this.resource);
        this.createSecurityGroupEgress(scope, this.resource);
    }

    private createSecurityGroup(scope: Stack, resourceInfo: ResourceInfo): CfnSecurityGroup {
        const securityGroup = new CfnSecurityGroup(scope, resourceInfo.id, {
            groupDescription: resourceInfo.groupDescription,
            groupName: resourceInfo.securityGroupName,
            vpcId: resourceInfo.vpcId,
            tags: resourceInfo.tags
        });
        return securityGroup;
    }

    private createSecurityGroupIngress(scope: Stack, resourceInfo: ResourceInfo) {
        for (const ingress of resourceInfo.ingresses) {
            const securityGroupIngress = new CfnSecurityGroupIngress(
                                                    scope, 
                                                    ingress.id, 
                                                    {...ingress.securityGroupIngressProps, ...{groupId: this.sg.attrGroupId}}
                                        );
        }
    }

    private createSecurityGroupEgress(scope: Stack, resourceInfo: ResourceInfo) {
        for (const egress of resourceInfo.egresses) {
            const securityGroupEgress = new CfnSecurityGroupEgress(
                                                    scope, 
                                                    egress.id, 
                                                    {...egress.securityGroupEgressProps, ...{groupId: this.sg.attrGroupId}}
                                        );
        }
    }

    private createSecurityInfo(){
        const workbook = xlsx.readFile(`excel/${this.securityGroupName}.xlsx`);
        const sheetIngress:xlsx.WorkSheet = workbook.Sheets['ingresses']; 
        const ingresses:IngressInfo[] = this.createIngressInfo(sheetIngress);
        const sheetEgress:xlsx.WorkSheet = workbook.Sheets['egresses']; 
        const egresses:EgressInfo[] = this.createEgressInfo(sheetEgress);
        const sheetSetting = workbook.Sheets['setting']; 
        const setting:Setting = this.createSetting(sheetSetting);

        this.resource = {
            id:setting.id,
            vpcId:setting.vpcId,
            groupDescription:setting.groupDescription,
            ingresses:ingresses,
            egresses:egresses,
            securityGroupName:setting.securityGroupName,
            tags:setting.tags
        }
    }
    private createIngressInfo(sheet:xlsx.WorkSheet){
        const rows:any[] = xlsx.utils.sheet_to_json(sheet);
        let ingress = [];
        for (const [index, ingressProps] of rows.entries()) {
            for(let key in ingressProps){
                if(ingressProps[key]==""){
                    delete ingressProps[key];
                }
            }
            const rule:IngressInfo = {
                id:`${this.securityGroupName}-ingress-rule-${index}`,
                securityGroupIngressProps: ingressProps,
            };
            ingress.push(rule);
        }
        return ingress;
    }

    private createEgressInfo(sheet:xlsx.WorkSheet){
        const rows:any[] = xlsx.utils.sheet_to_json(sheet);
        let egress = [];
        for (const [index, egressProps] of rows.entries()) {
            for(let key in egressProps){
                if(egressProps[key]==""){
                    delete egressProps[key];
                }
            }
            const rule:EgressInfo = {
                id:`${this.securityGroupName}-egress-rule-${index}`,
                securityGroupEgressProps: egressProps,
            };
            egress.push(rule);
        }
        return egress;
    }
    
    private createSetting(sheet:xlsx.WorkSheet){
        const setting:any = xlsx.utils.sheet_to_json(sheet)[0];
        const vpcId = setting["vpcId"];
        const tags = JSON.parse(setting["tags"]);
        const groupDescription = setting["groupDescription"];

        return {
            id: this.securityGroupName,
            vpcId: vpcId,
            groupDescription: groupDescription, 
            securityGroupName: this.securityGroupName,
            tags:tags
        };
    }
}

interface ResourceInfo {
    readonly id: string;
    readonly vpcId: string;
    readonly groupDescription: string;
    readonly ingresses: IngressInfo[];
    readonly egresses: EgressInfo[];
    readonly securityGroupName: string;
    readonly tags:CfnTag[];
}

interface IngressInfo {
    id: string;
    securityGroupIngressProps: CfnSecurityGroupIngressProps;
}

interface EgressInfo {
    id: string;
    securityGroupEgressProps: CfnSecurityGroupEgressProps;
}

interface Setting {
    id: string;
    vpcId:string;
    securityGroupName:string;
    groupDescription:string;
    tags:CfnTag[];
}