import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityGroup } from './resource/sg';
import {readdirSync} from "fs"

export class ExcelToSecuritygroupStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // const sg_hoge = new SecurityGroup("hoge");
    // sg_hoge.createResources(this);

    // const sg_fuga = new SecurityGroup("fuga");
    // sg_fuga.createResources(this);

    const filenames = readdirSync("excel/", {withFileTypes: true})
                            .map(dirent => dirent.name.replace(".xlsx", ""));
    for (const filename of filenames){
      const sg = new SecurityGroup(filename);
      sg.createResources(this);
    }
  }
}

