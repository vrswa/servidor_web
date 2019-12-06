#!/bin/sh

#INFO: arma un .zip para entregarle a clientes o desplegar, convertir a shelljs 
MY_DIR=`pwd`
echo 'Preparing release';
 COMMIT=`cat .git/logs/HEAD | tail -1 | cut "-d " -f1`;
 O="SmartWorkAR_demo_srv_SRC_`date -I`_$COMMIT";
 rm -Rf ../x_srv;
 mkdir -p ../x_srv/$O ;
 cp -r src/ tpl/ package* ../x_srv/$O ;
 cd ../x_srv ;
 zip -r $O.zip $O ;
 rm -rf $O ;
 cp $O.zip $MY_DIR/x_out/$O.zip
 unzip $O ;
 cd $O ;
 echo TESTING;
 npm i ;
 npm run serve;
 cd $MY_DIR
